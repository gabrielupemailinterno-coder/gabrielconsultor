
-- =========================
-- SCORE CONTENTS (base)
-- =========================
CREATE TABLE public.score_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  short_description text,
  body text NOT NULL DEFAULT '',
  video_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.score_contents TO authenticated;
GRANT ALL ON public.score_contents TO service_role;
ALTER TABLE public.score_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active contents" ON public.score_contents FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin manage contents" ON public.score_contents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_score_contents_updated BEFORE UPDATE ON public.score_contents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- SCORE SMART FEEDBACKS
-- =========================
CREATE TABLE public.score_smart_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text,
  body text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  video_url text,
  priority int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.score_smart_feedbacks TO authenticated;
GRANT ALL ON public.score_smart_feedbacks TO service_role;
ALTER TABLE public.score_smart_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active feedbacks" ON public.score_smart_feedbacks FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin manage feedbacks" ON public.score_smart_feedbacks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_score_smart_feedbacks_updated BEFORE UPDATE ON public.score_smart_feedbacks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- SCORE CONTENT VIEWS
-- =========================
CREATE TABLE public.score_content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.score_contents(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, content_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_content_views TO authenticated;
GRANT ALL ON public.score_content_views TO service_role;
ALTER TABLE public.score_content_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own content views" ON public.score_content_views FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read content views" ON public.score_content_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- SCORE FEEDBACK INTERACTIONS
-- =========================
CREATE TABLE public.score_feedback_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_id uuid NOT NULL REFERENCES public.score_smart_feedbacks(id) ON DELETE CASCADE,
  viewed_at timestamptz,
  mission_applied_at timestamptz,
  clicked_cta_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feedback_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_feedback_interactions TO authenticated;
GRANT ALL ON public.score_feedback_interactions TO service_role;
ALTER TABLE public.score_feedback_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feedback interactions" ON public.score_feedback_interactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read feedback interactions" ON public.score_feedback_interactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_score_feedback_interactions_updated BEFORE UPDATE ON public.score_feedback_interactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- SCORE UPSELL REQUESTS
-- =========================
CREATE TABLE public.score_upsell_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'dashboard',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.score_upsell_requests TO authenticated;
GRANT ALL ON public.score_upsell_requests TO service_role;
ALTER TABLE public.score_upsell_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert own upsell" ON public.score_upsell_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read own upsell" ON public.score_upsell_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin manage upsell" ON public.score_upsell_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_score_upsell_requests_updated BEFORE UPDATE ON public.score_upsell_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- SEED base contents (placeholders)
-- =========================
INSERT INTO public.score_contents (slug, title, category, short_description, body, sort_order) VALUES
('boas-vindas', 'Boas-vindas ao Score Comercial', 'Comece aqui', 'Como usar a plataforma para melhorar seus resultados.', '[INSERIR TEXTO COMPLETO DA BOAS-VINDAS]', 1),
('rotina-comercial', 'Como construir uma rotina comercial', 'Rotina Comercial', 'A base de qualquer vendedor consistente.', '[INSERIR TEXTO COMPLETO DA ROTINA COMERCIAL]', 2),
('bant-na-pratica', 'BANT na prática', 'Qualificação', 'Qualificando leads de forma objetiva.', '[INSERIR TEXTO COMPLETO DO BANT]', 3),
('spin-selling-na-pratica', 'SPIN Selling na prática', 'Qualificação', 'Perguntas que fazem o cliente enxergar valor.', '[INSERIR TEXTO COMPLETO DO SPIN]', 4),
('prospectar-todos-os-dias', 'Como prospectar todos os dias', 'Prospecção', 'Prospecção como hábito, não como evento.', '[INSERIR TEXTO COMPLETO DE PROSPECÇÃO]', 5),
('interpretar-funil', 'Como interpretar seu funil', 'Indicadores', 'Onde estão seus gargalos e o que fazer com eles.', '[INSERIR TEXTO COMPLETO DO FUNIL]', 6);

-- =========================
-- SEED smart feedbacks
-- =========================
INSERT INTO public.score_smart_feedbacks (trigger_key, title, short_description, body, mission, priority) VALUES
('consistencia_baixa', 'Seu problema agora é consistência', 'Você ficou dias sem registrar atividades.', '[INSERIR TEXTO "FALTA DE CONSISTÊNCIA"]', 'Registre suas atividades hoje e amanhã, sem falha.', 10),
('volume_prospeccao', 'Seu gargalo é volume de prospecção', 'Seu volume está abaixo da meta.', '[INSERIR TEXTO "POUCA PROSPECÇÃO"]', 'Faça hoje o dobro da sua média diária de prospecções.', 20),
('abordagem_baixa', 'Sua abordagem precisa melhorar', 'Muitas prospecções, poucos contatos efetivos.', '[INSERIR TEXTO "BAIXA CONVERSÃO DE ABORDAGEM"]', 'Revise seu script de abertura e teste 3 variações hoje.', 30),
('reunioes_baixas', 'Você precisa converter mais conversas em reuniões', 'Muitos contatos, poucas reuniões.', '[INSERIR TEXTO "POUCAS REUNIÕES"]', 'Em cada contato hoje, ofereça uma reunião com data e hora.', 40),
('propostas_baixas', 'Você pode estar apresentando cedo demais', 'Apresenta muito, mas envia poucas propostas.', '[INSERIR TEXTO "POUCAS PROPOSTAS"]', 'Antes de qualquer apresentação, valide dor + orçamento + decisor.', 50),
('fechamento_baixo', 'Seu gargalo está no fechamento', 'Muitas propostas, poucas vendas.', '[INSERIR TEXTO "POUCAS VENDAS"]', 'Revise suas propostas em aberto e faça 5 follow-ups hoje.', 60),
('follow_up', 'Você precisa fazer mais follow-up', 'Propostas em aberto sem retomada.', '[INSERIR TEXTO "FALTA DE FOLLOW-UP"]', 'Retome hoje todas as propostas enviadas nos últimos 15 dias.', 70),
('evolucao', 'Parabéns, você está evoluindo', 'Seus indicadores melhoraram esta semana.', '[INSERIR TEXTO "PARABÉNS PELA EVOLUÇÃO"]', 'Mantenha o ritmo por mais uma semana e revise o que funcionou.', 80),
('convite_diagnostico', 'Quer uma análise individual do seu funil?', 'Para quem já registra dados com consistência.', '[INSERIR TEXTO "CONVITE PARA DIAGNÓSTICO"]', 'Solicite uma análise individual com o Gabriel.', 90);
