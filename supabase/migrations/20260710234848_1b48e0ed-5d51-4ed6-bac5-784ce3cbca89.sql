-- Fix 1: bot_sessions — add explicit policies
CREATE POLICY "service role manages bot sessions"
  ON public.bot_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "admins view bot sessions"
  ON public.bot_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: recreate owner policies scoped to `authenticated` instead of `public`
DROP POLICY IF EXISTS "own campaigns" ON public.campaigns;
CREATE POLICY "own campaigns" ON public.campaigns FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own contacts" ON public.contacts;
CREATE POLICY "own contacts" ON public.contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own campaign_steps" ON public.campaign_steps;
CREATE POLICY "own campaign_steps" ON public.campaign_steps FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own logs" ON public.campaign_logs;
CREATE POLICY "own logs" ON public.campaign_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own blocklist" ON public.blocklist;
CREATE POLICY "own blocklist" ON public.blocklist FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own optouts" ON public.optouts;
CREATE POLICY "own optouts" ON public.optouts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own settings" ON public.settings;
CREATE POLICY "own settings" ON public.settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
