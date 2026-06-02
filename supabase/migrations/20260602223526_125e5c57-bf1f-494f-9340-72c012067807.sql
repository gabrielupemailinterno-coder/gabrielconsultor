ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'contato',
  ADD COLUMN IF NOT EXISTS answers jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_form_type ON public.leads(form_type);