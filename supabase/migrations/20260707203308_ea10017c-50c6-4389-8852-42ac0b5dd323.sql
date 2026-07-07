CREATE TABLE IF NOT EXISTS public.partner_trials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  product_type text NOT NULL CHECK (product_type IN ('score_comercial','mentoria','ambos')),
  contact_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked')),
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_trials TO authenticated;
GRANT ALL ON public.partner_trials TO service_role;

ALTER TABLE public.partner_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner_trials"
ON public.partner_trials
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER partner_trials_touch_updated_at
BEFORE UPDATE ON public.partner_trials
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS partner_trials_partner_idx ON public.partner_trials(partner_id);
CREATE INDEX IF NOT EXISTS partner_trials_status_idx ON public.partner_trials(status);

ALTER TABLE public.mentees
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS mentees_partner_idx ON public.mentees(partner_id);