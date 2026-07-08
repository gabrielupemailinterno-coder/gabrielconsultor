DROP POLICY IF EXISTS "Anyone can update session" ON public.page_sessions;

CREATE POLICY "Session heartbeat within 24h"
  ON public.page_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (started_at > (now() - interval '24 hours'))
  WITH CHECK (
    started_at > (now() - interval '24 hours')
    AND duration_seconds >= 0
  );