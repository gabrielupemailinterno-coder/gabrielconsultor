-- Wipe old templates and reinsert with SPIN structure for every plan
DELETE FROM public.meeting_templates;
DELETE FROM public.homework_templates;

INSERT INTO public.meeting_templates (plan_id, sequence, title, description)
SELECT p.id, v.seq, v.title, v.descr FROM public.mentorship_plans p,
(VALUES
  (1, 'Onboarding (40 min)', 'Alinhamento de expectativas, diagnóstico do ponto de partida e leitura do Cap. 1 do SPIN Selling (Comportamento de quem vende em vendas complexas).'),
  (2, 'S – Situação', 'Perguntas de Situação: mapear o contexto do cliente sem cansá-lo. Aplicação prática dos Cap. 2 e 3 do livro.'),
  (3, 'P – Problema', 'Perguntas de Problema: identificar dores reais e construir necessidades implícitas. Aplicação do Cap. 4.'),
  (4, 'I – Implicação', 'Perguntas de Implicação: ampliar a consequência das dores e gerar urgência. Aplicação do Cap. 5.'),
  (5, 'N – Necessidade de Solução', 'Perguntas de Need-payoff: o cliente verbaliza o ganho da solução. Aplicação do Cap. 6.'),
  (6, 'Demonstração de Capacidade & Objeções', 'Características × Vantagens × Benefícios e prevenção de objeções. Aplicação dos Cap. 7 e 8.'),
  (7, 'Compromisso & Continuidade', 'Tipos de avanço, fechamento consultivo e plano pós-venda de 90 dias. Aplicação dos Cap. 9 e 10.')
) AS v(seq, title, descr);

INSERT INTO public.homework_templates (plan_id, meeting_sequence, sort_order, title, description)
SELECT p.id, v.seq, v.so, v.title, v.descr FROM public.mentorship_plans p,
(VALUES
  (1, 0, 'Ler Cap. 1 do SPIN Selling', 'Marque trechos sobre as 4 fases de uma call (Abertura, Investigação, Demonstração, Obtenção de Compromisso).'),
  (1, 1, 'Preencher diagnóstico inicial', 'Envie pipeline atual, ticket médio, taxa de conversão e principais objeções recebidas.'),
  (2, 0, 'Listar 10 perguntas de Situação', 'Crie um roteiro de descoberta com perguntas de Situação relevantes para o seu ICP.'),
  (2, 1, 'Gravar 1 call real aplicando Situação', 'Anexe áudio/vídeo + análise: quantas perguntas de Situação x quantas de Problema.'),
  (3, 0, 'Mapear dores por segmento', 'Para cada vertical que você atende, liste as 3 maiores dores e como elas aparecem na conversa.'),
  (3, 1, 'Aplicar perguntas de Problema em 3 reuniões', 'Envie resumo: quais dores foram explicitadas pelo cliente, quais não.'),
  (4, 0, 'Construir cadeia de implicação', 'Para cada dor mapeada, monte a árvore: dor → impacto operacional → impacto financeiro.'),
  (4, 1, 'Aplicar Implicação em 3 calls', 'Anexe trechos onde o cliente reconhece o tamanho do problema.'),
  (5, 0, 'Roteiro Need-payoff', 'Liste 8 perguntas que façam o cliente descrever o valor da solução com as próprias palavras.'),
  (5, 1, 'Fechar 1 call usando Need-payoff', 'Anexe gravação e o avanço obtido (próximo passo concreto).'),
  (6, 0, 'Refazer pitch em formato Benefício', 'Reescreva sua apresentação eliminando Características puras; só Benefícios ligados a dores explícitas.'),
  (6, 1, 'Catálogo de objeções e respostas', 'Envie tabela: objeção recorrente → pergunta de Implicação/Need-payoff que a previne.'),
  (7, 0, 'Definir tipos de avanço por estágio', 'Para cada etapa do funil, defina qual é o avanço mínimo aceitável (não pode ser "continuação").'),
  (7, 1, 'Plano de 90 dias pós-mentoria', 'Metas mensuráveis, rituais semanais e indicadores que você vai acompanhar.')
) AS v(seq, so, title, descr);

-- Replace provisioning function: also seeds the SPIN book as resource for every meeting
CREATE OR REPLACE FUNCTION public.provision_mentee(_user_id uuid, _plan_id uuid, _full_name text, _email text, _phone text, _asaas_customer_id text, _asaas_payment_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _mentee_id uuid; _tpl record;
BEGIN
  INSERT INTO public.mentees (user_id, plan_id, full_name, email, phone, asaas_customer_id, asaas_payment_id, status, started_at)
  VALUES (_user_id, _plan_id, _full_name, _email, _phone, _asaas_customer_id, _asaas_payment_id, 'active', now())
  RETURNING id INTO _mentee_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentee') ON CONFLICT DO NOTHING;

  FOR _tpl IN SELECT sequence, title, description FROM public.meeting_templates WHERE plan_id = _plan_id ORDER BY sequence LOOP
    INSERT INTO public.meetings (mentee_id, sequence, title, description, status, unlocks_at)
    VALUES (
      _mentee_id, _tpl.sequence, _tpl.title, _tpl.description,
      CASE WHEN _tpl.sequence <= 2 THEN 'available' ELSE 'blocked' END,
      CASE WHEN _tpl.sequence <= 2 THEN now() ELSE now() + ((_tpl.sequence - 2) * interval '14 days') END
    );
  END LOOP;

  INSERT INTO public.homework_tasks (mentee_id, meeting_id, title, description)
  SELECT _mentee_id, mt.id, ht.title, ht.description
  FROM public.homework_templates ht
  JOIN public.meetings mt ON mt.mentee_id = _mentee_id AND mt.sequence = ht.meeting_sequence
  WHERE ht.plan_id = _plan_id
  ORDER BY ht.meeting_sequence, ht.sort_order;

  -- Seed SPIN Selling book as a base resource on every meeting
  INSERT INTO public.meeting_resources (meeting_id, kind, title, url)
  SELECT mt.id, 'pdf', 'Livro-base: SPIN Selling', '/__l5e/assets-v1/0758221d-f958-42c2-9c7b-feef035826cd/spin-selling.pdf'
  FROM public.meetings mt WHERE mt.mentee_id = _mentee_id;

  RETURN _mentee_id;
END $function$;