
-- 1) score_whatsapp_messages: log de mensagens WhatsApp do ritual diário
CREATE TABLE public.score_whatsapp_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  phone       text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('in','out')),
  kind        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.score_whatsapp_messages TO authenticated;
GRANT ALL ON public.score_whatsapp_messages TO service_role;
ALTER TABLE public.score_whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own whatsapp messages" ON public.score_whatsapp_messages
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_swm_user_created ON public.score_whatsapp_messages(user_id, created_at DESC);
CREATE INDEX idx_swm_kind_created ON public.score_whatsapp_messages(kind, created_at DESC);

-- 2) score_profiles: novas colunas
ALTER TABLE public.score_profiles
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_last_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS inactivity_penalty_days int NOT NULL DEFAULT 0;

-- 3) settings: templates configuráveis e master switch
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS whatsapp_ritual_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_templates jsonb NOT NULL DEFAULT '{}'::jsonb;
