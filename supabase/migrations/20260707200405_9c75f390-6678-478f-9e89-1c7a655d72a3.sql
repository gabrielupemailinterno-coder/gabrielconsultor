
-- Catalog of emittable events
CREATE TABLE public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sample_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read events" ON public.integration_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Configured outbound webhooks
CREATE TABLE public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  event_keys TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  timeout_ms INTEGER NOT NULL DEFAULT 10000,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  backoff_seconds INTEGER NOT NULL DEFAULT 60,
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_webhooks TO authenticated;
GRANT ALL ON public.integration_webhooks TO service_role;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all webhooks" ON public.integration_webhooks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER integration_webhooks_touch BEFORE UPDATE ON public.integration_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Delivery log
CREATE TABLE public.integration_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.integration_webhooks(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  duration_ms INTEGER,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_deliveries_webhook ON public.integration_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_integration_deliveries_retry ON public.integration_deliveries(status, next_retry_at)
  WHERE status IN ('pending','retrying');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_deliveries TO authenticated;
GRANT ALL ON public.integration_deliveries TO service_role;
ALTER TABLE public.integration_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all deliveries" ON public.integration_deliveries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed events
INSERT INTO public.integration_events (key, label, category, description, sample_payload) VALUES
  ('lead.contato', 'Lead — Contato rápido', 'lead', 'Formulário Contato rápido enviado', '{"nome":"Fulano","telefone":"5511999999999","email":"fulano@ex.com"}'),
  ('lead.mentoria_1a1_vendedores', 'Lead — Mentoria 1:1 (Vendedores)', 'lead', 'Formulário qualificador', '{"nome":"","telefone":"","email":"","respostas":{}}'),
  ('lead.consultoria_operacional', 'Lead — Consultoria Operacional', 'lead', 'Formulário qualificador', '{"nome":"","telefone":"","email":"","empresa":"","respostas":{}}'),
  ('lead.mentoria_estrategica', 'Lead — Mentoria Estratégica', 'lead', 'Formulário qualificador', '{"nome":"","telefone":"","email":"","empresa":"","respostas":{}}'),
  ('lead.lead_form_dialog', 'Lead — Modal padrão', 'lead', 'LeadFormDialog', '{"nome":"","telefone":"","email":""}'),
  ('score.signup', 'ScoreApp — Cadastro', 'score', 'Novo usuário do ScoreApp', '{"nome":"","telefone":"","email":""}'),
  ('score.onboarding_completed', 'ScoreApp — Onboarding concluído', 'score', 'Usuário concluiu onboarding', '{"user_id":""}'),
  ('score.daily_checkin', 'ScoreApp — Check-in diário', 'score', 'Log diário registrado', '{"user_id":"","score":0}'),
  ('score.talk_to_gabriel', 'ScoreApp — Falar com Gabriel', 'score', 'Solicitou contato', '{"user_id":""}'),
  ('score.assistant_intent', 'ScoreApp — Intenção no assistente', 'score', 'Intenção detectada', '{"user_id":"","intent":""}'),
  ('score.weekly_diagnostic', 'ScoreApp — Diagnóstico semanal', 'score', '', '{"user_id":""}'),
  ('score.inactive_recovery', 'ScoreApp — Recuperação de inativo', 'score', '', '{"user_id":""}'),
  ('score.upsell_requested', 'ScoreApp — Interesse em upsell', 'score', '', '{"user_id":"","source":""}'),
  ('mentee.provisioned', 'Mentorado — Provisionado', 'mentee', '', '{"mentee_id":"","email":""}'),
  ('mentee.meeting_scheduled', 'Mentorado — Reunião agendada', 'mentee', '', '{"mentee_id":"","meeting_id":""}'),
  ('mentee.meeting_completed', 'Mentorado — Reunião concluída', 'mentee', '', '{"mentee_id":"","meeting_id":""}'),
  ('mentee.homework_submitted', 'Mentorado — Tarefa entregue', 'mentee', '', '{"mentee_id":"","task_id":""}'),
  ('mentee.payment_received', 'Mentorado — Pagamento recebido', 'mentee', '', '{"mentee_id":"","amount":0}'),
  ('mentee.payment_failed', 'Mentorado — Pagamento falhou', 'mentee', '', '{"mentee_id":""}');

-- Seed default BotConversa webhook subscribing to lead + score events (mirrors current behavior)
INSERT INTO public.integration_webhooks (name, url, event_keys, enabled)
VALUES (
  'BotConversa (default)',
  'https://new-backend.botconversa.com.br/api/v1/webhooks-automation/catch/195152/eTId4HMCWYmw/',
  ARRAY[
    'lead.contato','lead.mentoria_1a1_vendedores','lead.consultoria_operacional',
    'lead.mentoria_estrategica','lead.lead_form_dialog','score.signup'
  ],
  true
);
