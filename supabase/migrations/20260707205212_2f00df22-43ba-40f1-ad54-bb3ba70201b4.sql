
-- 1. New role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'partner' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'partner';
  END IF;
END $$;

-- 2. Extend partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 70.00;

-- 3. Attribution columns on existing tables
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS partner_id uuid,
  ADD COLUMN IF NOT EXISTS partner_code text;

ALTER TABLE public.mentees
  ADD COLUMN IF NOT EXISTS partner_id uuid,
  ADD COLUMN IF NOT EXISTS partner_code text;

ALTER TABLE public.score_profiles
  ADD COLUMN IF NOT EXISTS partner_id uuid,
  ADD COLUMN IF NOT EXISTS partner_code text;

CREATE INDEX IF NOT EXISTS leads_partner_id_idx ON public.leads(partner_id);
CREATE INDEX IF NOT EXISTS mentees_partner_id_idx ON public.mentees(partner_id);
CREATE INDEX IF NOT EXISTS score_profiles_partner_id_idx ON public.score_profiles(partner_id);

-- 4. Allow partner to read own partners row
DROP POLICY IF EXISTS "Partners can read own row" ON public.partners;
CREATE POLICY "Partners can read own row"
ON public.partners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. partner_links
CREATE TABLE IF NOT EXISTS public.partner_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text,
  destination text NOT NULL DEFAULT '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_links TO authenticated;
GRANT ALL ON public.partner_links TO service_role;

ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner_links"
ON public.partner_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Partners read own links"
ON public.partner_links FOR SELECT TO authenticated
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners insert own links"
ON public.partner_links FOR INSERT TO authenticated
WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE POLICY "Partners update own links"
ON public.partner_links FOR UPDATE TO authenticated
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()))
WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE TRIGGER partner_links_touch_updated_at
BEFORE UPDATE ON public.partner_links
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS partner_links_partner_idx ON public.partner_links(partner_id);

-- 6. partner_attributions (clicks)
CREATE TABLE IF NOT EXISTS public.partner_attributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  link_id uuid REFERENCES public.partner_links(id) ON DELETE SET NULL,
  partner_code text NOT NULL,
  destination text,
  session_id text,
  ip_hash text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partner_attributions TO authenticated;
GRANT ALL ON public.partner_attributions TO service_role;

ALTER TABLE public.partner_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner_attributions"
ON public.partner_attributions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Partners read own attributions"
ON public.partner_attributions FOR SELECT TO authenticated
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS partner_attributions_partner_idx ON public.partner_attributions(partner_id);
CREATE INDEX IF NOT EXISTS partner_attributions_created_idx ON public.partner_attributions(created_at DESC);

-- 7. partner_conversions
CREATE TABLE IF NOT EXISTS public.partner_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  partner_code text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('lead','purchase')),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  amount_cents integer,
  commission_cents integer NOT NULL DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending','approved','paid','canceled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id)
);

GRANT SELECT ON public.partner_conversions TO authenticated;
GRANT ALL ON public.partner_conversions TO service_role;

ALTER TABLE public.partner_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage partner_conversions"
ON public.partner_conversions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Partners read own conversions"
ON public.partner_conversions FOR SELECT TO authenticated
USING (partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid()));

CREATE TRIGGER partner_conversions_touch_updated_at
BEFORE UPDATE ON public.partner_conversions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS partner_conversions_partner_idx ON public.partner_conversions(partner_id);
CREATE INDEX IF NOT EXISTS partner_conversions_status_idx ON public.partner_conversions(commission_status);

-- 8. Trigger: auto-calc commission from partner rate on insert
CREATE OR REPLACE FUNCTION public.partner_conversions_calc_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _rate numeric(5,2);
BEGIN
  IF NEW.commission_cents IS NULL OR NEW.commission_cents = 0 THEN
    IF NEW.amount_cents IS NOT NULL AND NEW.amount_cents > 0 THEN
      SELECT commission_rate INTO _rate FROM public.partners WHERE id = NEW.partner_id;
      IF _rate IS NULL THEN _rate := 70.00; END IF;
      NEW.commission_cents := floor(NEW.amount_cents * _rate / 100.0)::int;
    ELSE
      NEW.commission_cents := 0;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER partner_conversions_calc_commission
BEFORE INSERT ON public.partner_conversions
FOR EACH ROW EXECUTE FUNCTION public.partner_conversions_calc_commission();
