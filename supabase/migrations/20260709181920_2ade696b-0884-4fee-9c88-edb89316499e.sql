ALTER TABLE public.mentees
  ADD COLUMN IF NOT EXISTS next_meeting_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_meeting_link text,
  ADD COLUMN IF NOT EXISTS next_meeting_source text;
CREATE INDEX IF NOT EXISTS mentees_phone_idx ON public.mentees ((regexp_replace(coalesce(phone,''), '\D', '', 'g')));