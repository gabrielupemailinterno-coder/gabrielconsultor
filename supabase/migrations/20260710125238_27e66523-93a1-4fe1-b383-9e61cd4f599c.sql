
-- escola_profiles table
CREATE TABLE IF NOT EXISTS public.escola_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  phone_normalized text,
  lead_origin text,
  accepted_terms_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escola_profiles_phone_norm_idx ON public.escola_profiles(phone_normalized);

GRANT SELECT, INSERT, UPDATE ON public.escola_profiles TO authenticated;
GRANT ALL ON public.escola_profiles TO service_role;

ALTER TABLE public.escola_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escola_profiles_self_select" ON public.escola_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "escola_profiles_self_insert" ON public.escola_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "escola_profiles_self_update" ON public.escola_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER escola_profiles_touch
  BEFORE UPDATE ON public.escola_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Trigger: when a user signs up with source=escola, create profile + role
CREATE OR REPLACE FUNCTION public.handle_new_escola_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'source') = 'escola' THEN
    INSERT INTO public.escola_profiles (
      user_id, full_name, email, phone, phone_normalized, lead_origin, accepted_terms_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name',''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'phone_normalized',
      NEW.raw_user_meta_data->>'lead_origin',
      CASE WHEN (NEW.raw_user_meta_data->>'accepted_terms')::boolean THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, public.escola_profiles.phone),
      phone_normalized = COALESCE(EXCLUDED.phone_normalized, public.escola_profiles.phone_normalized),
      lead_origin = COALESCE(EXCLUDED.lead_origin, public.escola_profiles.lead_origin),
      accepted_terms_at = COALESCE(EXCLUDED.accepted_terms_at, public.escola_profiles.accepted_terms_at);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'escola_user'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_escola ON auth.users;
CREATE TRIGGER on_auth_user_created_escola
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_escola_user();

-- Close blog_posts to authenticated only (drop old public policies)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='blog_posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.blog_posts', pol.policyname);
  END LOOP;
END $$;

REVOKE SELECT ON public.blog_posts FROM anon;
GRANT SELECT ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

CREATE POLICY "blog_posts_authenticated_read_published" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
