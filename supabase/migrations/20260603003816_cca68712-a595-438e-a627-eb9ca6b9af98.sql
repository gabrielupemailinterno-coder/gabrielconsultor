ALTER TABLE public.mentees
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_notes text,
  ADD COLUMN IF NOT EXISTS payment_updated_at timestamptz;

ALTER TABLE public.mentees
  ADD CONSTRAINT mentees_access_mode_check CHECK (access_mode IN ('full','trial_then_paid')),
  ADD CONSTRAINT mentees_payment_status_check CHECK (payment_status IN ('pending','paid'));