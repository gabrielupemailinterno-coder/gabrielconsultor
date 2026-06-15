
CREATE TABLE public.mentee_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.mentees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentee_sessions_mentee_idx ON public.mentee_sessions(mentee_id, last_seen_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.mentee_sessions TO authenticated;
GRANT ALL ON public.mentee_sessions TO service_role;

ALTER TABLE public.mentee_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentee can insert own session"
  ON public.mentee_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentee can update own session"
  ON public.mentee_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentee and admin can read sessions"
  ON public.mentee_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
