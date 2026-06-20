
-- 1) Settings
CREATE TABLE public.settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  channel_id    text,
  agent_id      text,
  optout_text   text NOT NULL DEFAULT 'Para não receber novas mensagens, responda SAIR.',
  delay_seconds int  NOT NULL DEFAULT 3,
  batch_limit   int  NOT NULL DEFAULT 100,
  add_to_agent_context boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Campaigns
CREATE TABLE public.campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  message          text NOT NULL,
  status           text NOT NULL DEFAULT 'draft',
  kind             text NOT NULL DEFAULT 'social',
  destination_type text,
  group_id         text,
  total            int  NOT NULL DEFAULT 0,
  sent_count       int  NOT NULL DEFAULT 0,
  error_count      int  NOT NULL DEFAULT 0,
  cancelled_count  int  NOT NULL DEFAULT 0,
  add_optout       boolean NOT NULL DEFAULT false,
  add_to_agent_context boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) Campaign steps
CREATE TABLE public.campaign_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  step_order    int  NOT NULL,
  message       text NOT NULL,
  add_optout    boolean NOT NULL DEFAULT false,
  scheduled_at  timestamptz NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_steps TO authenticated;
GRANT ALL ON public.campaign_steps TO service_role;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaign_steps" ON public.campaign_steps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaign_steps_due
  ON public.campaign_steps(scheduled_at) WHERE status = 'pending';

-- 4) Contacts
CREATE TABLE public.contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  phone_raw     text NOT NULL,
  phone_e164    text NOT NULL,
  name          text,
  empresa       text,
  status        text NOT NULL DEFAULT 'pending',
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) Campaign logs
CREATE TABLE public.campaign_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  contact_id  uuid,
  user_id     uuid NOT NULL,
  status      text NOT NULL,
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_logs TO authenticated;
GRANT ALL ON public.campaign_logs TO service_role;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.campaign_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6) Blocklist
CREATE TABLE public.blocklist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  phone_e164 text NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone_e164)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocklist TO authenticated;
GRANT ALL ON public.blocklist TO service_role;
ALTER TABLE public.blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own blocklist" ON public.blocklist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7) Optouts
CREATE TABLE public.optouts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  phone_e164 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone_e164)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.optouts TO authenticated;
GRANT ALL ON public.optouts TO service_role;
ALTER TABLE public.optouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own optouts" ON public.optouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8) Triggers updated_at (reusa função pública existente)
CREATE OR REPLACE FUNCTION public.touch_updated_at_v2()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_settings_upd       BEFORE UPDATE ON public.settings       FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_v2();
CREATE TRIGGER trg_campaigns_upd      BEFORE UPDATE ON public.campaigns      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_v2();
CREATE TRIGGER trg_campaign_steps_upd BEFORE UPDATE ON public.campaign_steps FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_v2();
CREATE TRIGGER trg_contacts_upd       BEFORE UPDATE ON public.contacts       FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at_v2();

-- 9) Extensões
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
