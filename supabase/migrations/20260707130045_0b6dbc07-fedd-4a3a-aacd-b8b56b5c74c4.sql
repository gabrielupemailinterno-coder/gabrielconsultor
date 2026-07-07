
-- Add BotConversa fields to score_profiles
ALTER TABLE public.score_profiles
  ADD COLUMN IF NOT EXISTS botconversa_subscriber_id text,
  ADD COLUMN IF NOT EXISTS daily_checkin_time time NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT true;

-- Integration logs
CREATE TABLE IF NOT EXISTS public.botconversa_integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text,
  direction text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  response jsonb,
  status text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS botconversa_logs_created_idx ON public.botconversa_integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS botconversa_logs_user_idx ON public.botconversa_integration_logs(user_id, created_at DESC);
GRANT SELECT ON public.botconversa_integration_logs TO authenticated;
GRANT ALL ON public.botconversa_integration_logs TO service_role;
ALTER TABLE public.botconversa_integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read botconversa logs" ON public.botconversa_integration_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Pending webhooks (unresolved user lookups)
CREATE TABLE IF NOT EXISTS public.botconversa_pending_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  email text,
  payload jsonb NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS botconversa_pending_status_idx ON public.botconversa_pending_webhooks(status, created_at DESC);
GRANT SELECT, UPDATE ON public.botconversa_pending_webhooks TO authenticated;
GRANT ALL ON public.botconversa_pending_webhooks TO service_role;
ALTER TABLE public.botconversa_pending_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read pending" ON public.botconversa_pending_webhooks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin update pending" ON public.botconversa_pending_webhooks
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
