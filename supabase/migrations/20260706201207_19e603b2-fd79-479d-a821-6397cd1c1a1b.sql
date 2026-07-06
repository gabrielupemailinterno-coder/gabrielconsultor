
-- Fluxos editáveis
CREATE TABLE public.bot_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  graph jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  priority int NOT NULL DEFAULT 0,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_flows TO authenticated;
GRANT ALL ON public.bot_flows TO service_role;

ALTER TABLE public.bot_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage bot_flows"
  ON public.bot_flows FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_bot_flows_updated_at
  BEFORE UPDATE ON public.bot_flows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Versões
CREATE TABLE public.bot_flow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.bot_flows(id) ON DELETE CASCADE,
  version int NOT NULL,
  graph jsonb NOT NULL,
  triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, DELETE ON public.bot_flow_versions TO authenticated;
GRANT ALL ON public.bot_flow_versions TO service_role;

ALTER TABLE public.bot_flow_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage bot_flow_versions"
  ON public.bot_flow_versions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Sessões de conversa por telefone
CREATE TABLE public.bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  user_id uuid,
  flow_id uuid REFERENCES public.bot_flows(id) ON DELETE SET NULL,
  current_node_id text,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bot_sessions TO service_role;
-- sem grant a authenticated/anon: só o backend acessa

ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
-- sem policies: só service_role escreve/lê

CREATE TRIGGER touch_bot_sessions_updated_at
  BEFORE UPDATE ON public.bot_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed dos 2 fluxos padrão
INSERT INTO public.bot_flows (name, description, triggers, graph, is_active, priority) VALUES
(
  'Registro de hoje',
  'Registra o score de hoje perguntando campo a campo.',
  '["registrar","score de hoje","fechar meu dia","fechar dia","bora"]'::jsonb,
  '{
    "nodes":[
      {"id":"start","type":"trigger","position":{"x":0,"y":0},"data":{"label":"Início"}},
      {"id":"set_today","type":"action","position":{"x":0,"y":100},"data":{"label":"Data = hoje","action":"set_date_today"}},
      {"id":"q_lig","type":"question","position":{"x":0,"y":200},"data":{"label":"Ligações","field":"ligacoes","prompt":"Fala {{primeiro_nome}}! Bora fechar seu score de {{data_br}}. Quantas ligações você fez?","validation":"number"}},
      {"id":"q_wpp","type":"question","position":{"x":0,"y":300},"data":{"label":"WhatsApps","field":"whatsapps","prompt":"E quantos WhatsApps você enviou?","validation":"number"}},
      {"id":"q_prosp","type":"question","position":{"x":0,"y":400},"data":{"label":"Prospecções","field":"prospeccoes","prompt":"Novos leads/prospecções?","validation":"number"}},
      {"id":"q_cont","type":"question","position":{"x":0,"y":500},"data":{"label":"Contatos efetivos","field":"contatos_efetivos","prompt":"Contatos efetivos (conversas reais)?","validation":"number"}},
      {"id":"q_reun","type":"question","position":{"x":0,"y":600},"data":{"label":"Reuniões","field":"reunioes_agendadas","prompt":"Reuniões agendadas?","validation":"number"}},
      {"id":"q_apres","type":"question","position":{"x":0,"y":700},"data":{"label":"Apresentações","field":"apresentacoes","prompt":"Apresentações realizadas?","validation":"number"}},
      {"id":"q_prop","type":"question","position":{"x":0,"y":800},"data":{"label":"Propostas","field":"propostas","prompt":"Propostas enviadas?","validation":"number"}},
      {"id":"q_vendas","type":"question","position":{"x":0,"y":900},"data":{"label":"Vendas","field":"vendas","prompt":"Vendas fechadas?","validation":"number"}},
      {"id":"q_valor","type":"question","position":{"x":0,"y":1000},"data":{"label":"Valor vendido","field":"valor_vendido","prompt":"Valor total vendido (R$)?","validation":"number"}},
      {"id":"save","type":"action","position":{"x":0,"y":1100},"data":{"label":"Salvar log","action":"save_log"}},
      {"id":"end","type":"end","position":{"x":0,"y":1200},"data":{"label":"Fim","message":"Registrado ✅\n\nScore de {{data_br}}: {{score}}/100 ({{score_label}}){{streak_line}}\n\nManda bala amanhã, {{primeiro_nome}}!"}}
    ],
    "edges":[
      {"id":"e1","source":"start","target":"set_today"},
      {"id":"e2","source":"set_today","target":"q_lig"},
      {"id":"e3","source":"q_lig","target":"q_wpp"},
      {"id":"e4","source":"q_wpp","target":"q_prosp"},
      {"id":"e5","source":"q_prosp","target":"q_cont"},
      {"id":"e6","source":"q_cont","target":"q_reun"},
      {"id":"e7","source":"q_reun","target":"q_apres"},
      {"id":"e8","source":"q_apres","target":"q_prop"},
      {"id":"e9","source":"q_prop","target":"q_vendas"},
      {"id":"e10","source":"q_vendas","target":"q_valor"},
      {"id":"e11","source":"q_valor","target":"save"},
      {"id":"e12","source":"save","target":"end"}
    ]
  }'::jsonb,
  true,
  10
),
(
  'Registro de data específica',
  'Permite registrar até 7 dias no passado. Pergunta a data primeiro.',
  '["registrar do dia","registrar de ontem","registrar anteontem","quero registrar","registrar dia"]'::jsonb,
  '{
    "nodes":[
      {"id":"start","type":"trigger","position":{"x":0,"y":0},"data":{"label":"Início"}},
      {"id":"q_data","type":"question","position":{"x":0,"y":100},"data":{"label":"Data","field":"data","prompt":"Beleza! De qual dia é o registro? (ex: ontem, anteontem, 12/03)","validation":"date_past_7"}},
      {"id":"q_lig","type":"question","position":{"x":0,"y":200},"data":{"label":"Ligações","field":"ligacoes","prompt":"Ok, dia {{data_br}}. Quantas ligações você fez?","validation":"number"}},
      {"id":"q_wpp","type":"question","position":{"x":0,"y":300},"data":{"label":"WhatsApps","field":"whatsapps","prompt":"E quantos WhatsApps?","validation":"number"}},
      {"id":"q_prosp","type":"question","position":{"x":0,"y":400},"data":{"label":"Prospecções","field":"prospeccoes","prompt":"Novos leads/prospecções?","validation":"number"}},
      {"id":"q_cont","type":"question","position":{"x":0,"y":500},"data":{"label":"Contatos efetivos","field":"contatos_efetivos","prompt":"Contatos efetivos?","validation":"number"}},
      {"id":"q_reun","type":"question","position":{"x":0,"y":600},"data":{"label":"Reuniões","field":"reunioes_agendadas","prompt":"Reuniões agendadas?","validation":"number"}},
      {"id":"q_apres","type":"question","position":{"x":0,"y":700},"data":{"label":"Apresentações","field":"apresentacoes","prompt":"Apresentações?","validation":"number"}},
      {"id":"q_prop","type":"question","position":{"x":0,"y":800},"data":{"label":"Propostas","field":"propostas","prompt":"Propostas enviadas?","validation":"number"}},
      {"id":"q_vendas","type":"question","position":{"x":0,"y":900},"data":{"label":"Vendas","field":"vendas","prompt":"Vendas fechadas?","validation":"number"}},
      {"id":"q_valor","type":"question","position":{"x":0,"y":1000},"data":{"label":"Valor vendido","field":"valor_vendido","prompt":"Valor total vendido (R$)?","validation":"number"}},
      {"id":"save","type":"action","position":{"x":0,"y":1100},"data":{"label":"Salvar log","action":"save_log"}},
      {"id":"end","type":"end","position":{"x":0,"y":1200},"data":{"label":"Fim","message":"Registrado ✅\n\nScore de {{data_br}}: {{score}}/100 ({{score_label}}){{streak_line}}"}}
    ],
    "edges":[
      {"id":"e1","source":"start","target":"q_data"},
      {"id":"e2","source":"q_data","target":"q_lig"},
      {"id":"e3","source":"q_lig","target":"q_wpp"},
      {"id":"e4","source":"q_wpp","target":"q_prosp"},
      {"id":"e5","source":"q_prosp","target":"q_cont"},
      {"id":"e6","source":"q_cont","target":"q_reun"},
      {"id":"e7","source":"q_reun","target":"q_apres"},
      {"id":"e8","source":"q_apres","target":"q_prop"},
      {"id":"e9","source":"q_prop","target":"q_vendas"},
      {"id":"e10","source":"q_vendas","target":"q_valor"},
      {"id":"e11","source":"q_valor","target":"save"},
      {"id":"e12","source":"save","target":"end"}
    ]
  }'::jsonb,
  true,
  20
);
