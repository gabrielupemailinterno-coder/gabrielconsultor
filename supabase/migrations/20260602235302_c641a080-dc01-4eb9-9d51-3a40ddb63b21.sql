CREATE TABLE public.mentee_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentee_admin_notes TO authenticated;
GRANT ALL ON public.mentee_admin_notes TO service_role;

ALTER TABLE public.mentee_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notes" ON public.mentee_admin_notes
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert notes" ON public.mentee_admin_notes
FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update notes" ON public.mentee_admin_notes
FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete notes" ON public.mentee_admin_notes
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER mentee_admin_notes_touch
BEFORE UPDATE ON public.mentee_admin_notes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();