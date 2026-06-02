
-- 1. Add 'mentee' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mentee';

-- 2. Mentorship plans catalog
CREATE TABLE public.mentorship_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  installments integer NOT NULL DEFAULT 1,
  total_meetings integer NOT NULL DEFAULT 6,
  duration_months integer NOT NULL DEFAULT 3,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mentorship_plans TO anon, authenticated;
GRANT ALL ON public.mentorship_plans TO service_role;
ALTER TABLE public.mentorship_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active plans" ON public.mentorship_plans FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage plans" ON public.mentorship_plans FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Mentees
CREATE TABLE public.mentees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.mentorship_plans(id),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cpf text,
  asaas_customer_id text,
  asaas_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mentees TO authenticated;
GRANT ALL ON public.mentees TO service_role;
ALTER TABLE public.mentees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentee reads self" ON public.mentees FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Mentee updates self" ON public.mentees FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin inserts mentee" ON public.mentees FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Meetings (6 per mentee)
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'blocked',
  google_event_id text,
  meet_link text,
  unlocks_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mentee_id, sequence)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentee reads own meetings" ON public.meetings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = meetings.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Mentee updates own meetings" ON public.meetings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = meetings.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Admin inserts meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes meetings" ON public.meetings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 5. Resources per meeting
CREATE TABLE public.meeting_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_resources TO authenticated;
GRANT ALL ON public.meeting_resources TO service_role;
ALTER TABLE public.meeting_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentee reads resources" ON public.meeting_resources FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.meetings mt JOIN public.mentees m ON m.id = mt.mentee_id
    WHERE mt.id = meeting_resources.meeting_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Admin manages resources" ON public.meeting_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. Homework tasks
CREATE TABLE public.homework_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_tasks TO authenticated;
GRANT ALL ON public.homework_tasks TO service_role;
ALTER TABLE public.homework_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentee reads own homework" ON public.homework_tasks FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = homework_tasks.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Mentee updates own homework" ON public.homework_tasks FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = homework_tasks.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Admin manages homework" ON public.homework_tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes homework" ON public.homework_tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 7. Metrics checkpoints (biweekly)
CREATE TABLE public.metrics_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  leads_inbound integer NOT NULL DEFAULT 0,
  leads_outbound integer NOT NULL DEFAULT 0,
  connection_rate numeric(5,2) NOT NULL DEFAULT 0,
  meetings_scheduled integer NOT NULL DEFAULT 0,
  meetings_held integer NOT NULL DEFAULT 0,
  sales_count integer NOT NULL DEFAULT 0,
  revenue_cents integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mentee_id, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metrics_checkpoints TO authenticated;
GRANT ALL ON public.metrics_checkpoints TO service_role;
ALTER TABLE public.metrics_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentee reads own metrics" ON public.metrics_checkpoints FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = metrics_checkpoints.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Mentee writes own metrics" ON public.metrics_checkpoints FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = metrics_checkpoints.mentee_id AND m.user_id = auth.uid())
);
CREATE POLICY "Mentee updates own metrics" ON public.metrics_checkpoints FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = metrics_checkpoints.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Mentee deletes own metrics" ON public.metrics_checkpoints FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.mentees m WHERE m.id = metrics_checkpoints.mentee_id AND (m.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);

-- 8. updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_mentees_updated BEFORE UPDATE ON public.mentees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_metrics_updated BEFORE UPDATE ON public.metrics_checkpoints FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 9. Seed plan
INSERT INTO public.mentorship_plans (slug, name, description, price_cents, installments, total_meetings, duration_months)
VALUES ('mentoria-comercial-3m', 'Mentoria Comercial 1:1 — 3 Meses',
  '6 encontros quinzenais, tarefas táticas, repositório de frameworks e acompanhamento de métricas reais.',
  19700, 3, 6, 3);

-- 10. Seed default homework templates per meeting (storage table)
CREATE TABLE public.homework_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  meeting_sequence integer NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.homework_templates TO authenticated;
GRANT ALL ON public.homework_templates TO service_role;
ALTER TABLE public.homework_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth reads templates" ON public.homework_templates FOR SELECT TO authenticated USING (true);

CREATE TABLE public.meeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.mentorship_plans(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  title text NOT NULL,
  description text,
  UNIQUE(plan_id, sequence)
);
GRANT SELECT ON public.meeting_templates TO authenticated;
GRANT ALL ON public.meeting_templates TO service_role;
ALTER TABLE public.meeting_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth reads meeting templates" ON public.meeting_templates FOR SELECT TO authenticated USING (true);

WITH p AS (SELECT id FROM public.mentorship_plans WHERE slug='mentoria-comercial-3m')
INSERT INTO public.meeting_templates (plan_id, sequence, title, description) VALUES
((SELECT id FROM p), 1, 'Diagnóstico Comercial e Mapeamento do Funil', 'Raio-X completo do processo comercial atual e dores prioritárias.'),
((SELECT id FROM p), 2, 'Definição de ICP e Posicionamento', 'Construção da Matriz de ICP e refinamento de proposta de valor.'),
((SELECT id FROM p), 3, 'Prospecção Outbound e Régua WhatsApp', 'Desenho da cadência multicanal e scripts de abordagem.'),
((SELECT id FROM p), 4, 'SPIN Selling e Discovery', 'Pitch consultivo, perguntas-chave e técnica SPIN aplicada.'),
((SELECT id FROM p), 5, 'Negociação, Objeções e Fechamento', 'Frameworks de objeção, ancoragem e técnicas de closing.'),
((SELECT id FROM p), 6, 'Gestão por Indicadores e Próximos 90 dias', 'Dashboard de métricas, plano de continuidade e ritmo de execução.');

WITH p AS (SELECT id FROM public.mentorship_plans WHERE slug='mentoria-comercial-3m')
INSERT INTO public.homework_templates (plan_id, meeting_sequence, title, description, sort_order) VALUES
((SELECT id FROM p), 1, 'Mapeamento do Funil Atual', 'Documente cada etapa do funil com volume e taxa de conversão.', 1),
((SELECT id FROM p), 1, 'Levantamento de gargalos', 'Liste os 3 maiores gargalos do funil hoje.', 2),
((SELECT id FROM p), 2, 'Preenchimento da Matriz de ICP', 'Complete a matriz de Cliente Ideal com 5 atributos.', 1),
((SELECT id FROM p), 2, 'Lista de 50 contas-alvo', 'Construa lista qualificada baseada no ICP.', 2),
((SELECT id FROM p), 3, 'Desenho da Régua de Abordagem WhatsApp', '7 touchpoints com gatilhos e mensagens.', 1),
((SELECT id FROM p), 3, 'Configuração de cadência outbound', 'E-mail + WhatsApp + LinkedIn por 14 dias.', 2),
((SELECT id FROM p), 4, 'Gravação de Pitch com SPIN Selling', 'Áudio/vídeo de 5min aplicando SPIN.', 1),
((SELECT id FROM p), 4, 'Banco de perguntas SPIN', '20 perguntas (Situação, Problema, Implicação, Necessidade).', 2),
((SELECT id FROM p), 5, 'Mapa de objeções e contra-argumentos', 'Top 10 objeções e respostas estruturadas.', 1),
((SELECT id FROM p), 5, 'Simulação de fechamento gravada', 'Role-play de fechamento de 10min.', 2),
((SELECT id FROM p), 6, 'Dashboard de métricas semanais', 'Painel com 6 KPIs comerciais atualizado.', 1),
((SELECT id FROM p), 6, 'Plano de execução 90 dias', 'Metas, ritmo e responsáveis para o próximo trimestre.', 2);

-- 11. Function to provision a new mentee (called by webhook edge function via service role)
CREATE OR REPLACE FUNCTION public.provision_mentee(
  _user_id uuid, _plan_id uuid, _full_name text, _email text, _phone text,
  _asaas_customer_id text, _asaas_payment_id text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _mentee_id uuid; _started date; _tpl record;
BEGIN
  _started := current_date;
  INSERT INTO public.mentees (user_id, plan_id, full_name, email, phone, asaas_customer_id, asaas_payment_id, status, started_at)
  VALUES (_user_id, _plan_id, _full_name, _email, _phone, _asaas_customer_id, _asaas_payment_id, 'active', now())
  RETURNING id INTO _mentee_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentee') ON CONFLICT DO NOTHING;

  -- 6 meetings: unlock 1 at week 0, 2 at week 2, 3 at week 4, ... (every 2 weeks)
  FOR _tpl IN SELECT sequence, title, description FROM public.meeting_templates WHERE plan_id = _plan_id ORDER BY sequence LOOP
    INSERT INTO public.meetings (mentee_id, sequence, title, description, status, unlocks_at)
    VALUES (
      _mentee_id, _tpl.sequence, _tpl.title, _tpl.description,
      CASE WHEN _tpl.sequence <= 2 THEN 'available' ELSE 'blocked' END,
      (now() + ((_tpl.sequence - 1) * interval '14 days'))
    );
  END LOOP;

  -- Homework from templates
  INSERT INTO public.homework_tasks (mentee_id, meeting_id, title, description)
  SELECT _mentee_id, mt.id, ht.title, ht.description
  FROM public.homework_templates ht
  JOIN public.meetings mt ON mt.mentee_id = _mentee_id AND mt.sequence = ht.meeting_sequence
  WHERE ht.plan_id = _plan_id
  ORDER BY ht.meeting_sequence, ht.sort_order;

  RETURN _mentee_id;
END $$;
REVOKE ALL ON FUNCTION public.provision_mentee(uuid,uuid,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_mentee(uuid,uuid,text,text,text,text,text) TO service_role;
