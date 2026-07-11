
-- 1) Add per-session secret token
ALTER TABLE public.page_sessions
  ADD COLUMN IF NOT EXISTS edit_token uuid;

-- 2) Remove the overly-permissive UPDATE policy and revoke direct UPDATE
DROP POLICY IF EXISTS "Session heartbeat within 24h" ON public.page_sessions;
DROP POLICY IF EXISTS "Anyone can update session" ON public.page_sessions;
REVOKE UPDATE ON public.page_sessions FROM anon, authenticated;

-- 3) Security-definer RPC: only the client that knows the edit_token
--    (kept in their own sessionStorage) can update their heartbeat.
CREATE OR REPLACE FUNCTION public.update_page_session_heartbeat(
  p_session_id uuid,
  p_edit_token uuid,
  p_duration_seconds integer,
  p_last_seen_at timestamptz DEFAULT now(),
  p_path text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_token uuid;
  _started_at timestamptz;
BEGIN
  IF p_session_id IS NULL OR p_edit_token IS NULL THEN
    RAISE EXCEPTION 'session_id and edit_token are required';
  END IF;

  SELECT edit_token, started_at
    INTO _existing_token, _started_at
  FROM public.page_sessions
  WHERE session_id = p_session_id
  FOR UPDATE;

  -- Row must exist and be recent (24h window, same as before)
  IF NOT FOUND OR _started_at < now() - interval '24 hours' THEN
    RETURN;
  END IF;

  -- First heartbeat claims the token; subsequent calls must match
  IF _existing_token IS NULL THEN
    UPDATE public.page_sessions
       SET edit_token = p_edit_token,
           duration_seconds = GREATEST(COALESCE(duration_seconds,0), p_duration_seconds),
           last_seen_at = p_last_seen_at,
           path = COALESCE(p_path, path)
     WHERE session_id = p_session_id;
  ELSIF _existing_token = p_edit_token THEN
    UPDATE public.page_sessions
       SET duration_seconds = GREATEST(COALESCE(duration_seconds,0), p_duration_seconds),
           last_seen_at = p_last_seen_at,
           path = COALESCE(p_path, path)
     WHERE session_id = p_session_id;
  END IF;
  -- silent no-op if token mismatch (prevents probing)
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_page_session_heartbeat(uuid, uuid, integer, timestamptz, text)
  TO anon, authenticated;
