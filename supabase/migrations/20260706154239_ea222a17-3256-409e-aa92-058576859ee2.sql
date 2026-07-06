
-- New role
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scoreapp_user';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- score_profiles
CREATE TABLE public.score_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  profession text,
  experience_level text,
  lead_origin text,
  segment text,
  accepted_terms_at timestamptz,
  plan text NOT NULL DEFAULT 'free',
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_profiles TO authenticated;
GRANT ALL ON public.score_profiles TO service_role;
ALTER TABLE public.score_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.score_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.score_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.score_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_score_profiles_updated BEFORE UPDATE ON public.score_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- score_goals
CREATE TABLE public.score_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_mensal_valor numeric(12,2) NOT NULL DEFAULT 0,
  ticket_medio numeric(12,2) NOT NULL DEFAULT 0,
  meta_vendas integer NOT NULL DEFAULT 0,
  ligacoes_dia integer NOT NULL DEFAULT 0,
  whatsapps_dia integer NOT NULL DEFAULT 0,
  apresentacoes_semana integer NOT NULL DEFAULT 0,
  propostas_semana integer NOT NULL DEFAULT 0,
  segmento text,
  effective_from date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX score_goals_user_idx ON public.score_goals(user_id, effective_from DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_goals TO authenticated;
GRANT ALL ON public.score_goals TO service_role;
ALTER TABLE public.score_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals rw" ON public.score_goals FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_score_goals_updated BEFORE UPDATE ON public.score_goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- score_daily_logs
CREATE TABLE public.score_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT current_date,
  ligacoes integer NOT NULL DEFAULT 0,
  whatsapps integer NOT NULL DEFAULT 0,
  prospeccoes integer NOT NULL DEFAULT 0,
  contatos_efetivos integer NOT NULL DEFAULT 0,
  reunioes_agendadas integer NOT NULL DEFAULT 0,
  apresentacoes integer NOT NULL DEFAULT 0,
  propostas integer NOT NULL DEFAULT 0,
  vendas integer NOT NULL DEFAULT 0,
  valor_vendido numeric(12,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX score_logs_user_date_idx ON public.score_daily_logs(user_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_daily_logs TO authenticated;
GRANT ALL ON public.score_daily_logs TO service_role;
ALTER TABLE public.score_daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs rw" ON public.score_daily_logs FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_score_logs_updated BEFORE UPDATE ON public.score_daily_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- score_content_modules
CREATE TABLE public.score_content_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  slug text NOT NULL UNIQUE,
  titulo text NOT NULL,
  descricao text,
  video_url text,
  material_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.score_content_modules TO authenticated, anon;
GRANT ALL ON public.score_content_modules TO service_role;
ALTER TABLE public.score_content_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules public read" ON public.score_content_modules FOR SELECT USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "modules admin write" ON public.score_content_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_score_modules_updated BEFORE UPDATE ON public.score_content_modules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- score_content_progress
CREATE TABLE public.score_content_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.score_content_modules(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_content_progress TO authenticated;
GRANT ALL ON public.score_content_progress TO service_role;
ALTER TABLE public.score_content_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress rw" ON public.score_content_progress FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);

-- score_badges
CREATE TABLE public.score_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
GRANT SELECT, INSERT, DELETE ON public.score_badges TO authenticated;
GRANT ALL ON public.score_badges TO service_role;
ALTER TABLE public.score_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges rw" ON public.score_badges FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);

-- score_upsell_interests
CREATE TABLE public.score_upsell_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context text NOT NULL DEFAULT 'analise_funil',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.score_upsell_interests TO authenticated;
GRANT ALL ON public.score_upsell_interests TO service_role;
ALTER TABLE public.score_upsell_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upsell insert own" ON public.score_upsell_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upsell read own or admin" ON public.score_upsell_interests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Seed modules
INSERT INTO public.score_content_modules (categoria, slug, titulo, descricao, sort_order) VALUES
('Fundamentos','mentalidade-comercial','Mentalidade Comercial','Como pensar como um vendedor de alta performance.',1),
('Fundamentos','agenda-comercial','Agenda Comercial','Organizando o dia para maximizar resultados.',2),
('Prospecção','prospeccao','Prospecção','Como gerar novas oportunidades todos os dias.',3),
('Prospecção','ligacao','Ligação','Estrutura de uma ligação que converte.',4),
('Prospecção','whatsapp','WhatsApp','Abordagem e cadência pelo WhatsApp.',5),
('Método','spin-selling','SPIN Selling','Situação, Problema, Implicação e Necessidade.',6),
('Método','bant','BANT','Qualificação por Budget, Authority, Need, Timing.',7),
('Método','follow-up','Follow-up','Como fazer follow-up sem parecer chato.',8),
('Reunião','apresentacao-comercial','Apresentação Comercial','Estrutura de uma apresentação vencedora.',9),
('Fechamento','objecoes','Objeções','Como contornar as objeções mais comuns.',10),
('Fechamento','negociacao','Negociação','Princípios de negociação para vendas.',11),
('Fechamento','fechamento','Fechamento','Técnicas para fechar mais vendas.',12),
('Gestão','organizacao-funil','Organização do Funil','Mantendo o funil saudável e previsível.',13);

-- Auto-provision profile + role on signup for scoreapp signups (marker in raw_user_meta_data.source='scoreapp')
CREATE OR REPLACE FUNCTION public.handle_new_scoreapp_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'source') = 'scoreapp' THEN
    INSERT INTO public.score_profiles (user_id, full_name, email, phone, profession, experience_level, lead_origin, segment, accepted_terms_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name',''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'profession',
      NEW.raw_user_meta_data->>'experience_level',
      NEW.raw_user_meta_data->>'lead_origin',
      NEW.raw_user_meta_data->>'segment',
      CASE WHEN (NEW.raw_user_meta_data->>'accepted_terms')::boolean THEN now() ELSE NULL END
    ) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'scoreapp_user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_scoreapp ON auth.users;
CREATE TRIGGER on_auth_user_created_scoreapp
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_scoreapp_user();
