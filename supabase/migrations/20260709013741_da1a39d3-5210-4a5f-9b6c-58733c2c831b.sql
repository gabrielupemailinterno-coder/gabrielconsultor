
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS product_interest text,
  ADD COLUMN IF NOT EXISTS source_path text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_leads_landing_page ON public.leads(landing_page);
CREATE INDEX IF NOT EXISTS idx_leads_product_interest ON public.leads(product_interest);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Backfill landing_page / product_interest from historical `source` (URL path) and `form_type`
UPDATE public.leads SET
  source_path = COALESCE(source_path, source),
  landing_page = COALESCE(landing_page,
    CASE
      WHEN source ILIKE '/scoreapp%' OR source ILIKE '%score%' THEN 'score_comercial'
      WHEN source ILIKE '/mentoria-profissional%' OR source ILIKE '%mentoria%' THEN 'mentoria_comercial'
      WHEN source ILIKE '/associadoacidel%' OR source ILIKE '%aci%' THEN 'aci_del_rei'
      WHEN source ILIKE '/parceiros%' OR source ILIKE '/parceria%' THEN 'parceiros'
      WHEN source ILIKE '/r/%' THEN 'parceiros'
      WHEN source = '/' OR source IS NULL OR source = '' THEN 'site_principal'
      ELSE 'site_principal'
    END
  ),
  product_interest = COALESCE(product_interest,
    CASE form_type
      WHEN 'contato' THEN 'contato_geral'
      WHEN 'whatsapp' THEN 'contato_geral'
      WHEN 'mentoria_1a1_vendedores' THEN 'mentoria_comercial'
      WHEN 'consultoria_operacional' THEN 'consultoria_operacional'
      WHEN 'mentoria_estrategica' THEN 'mentoria_estrategica'
      ELSE 'contato_geral'
    END
  )
WHERE landing_page IS NULL OR product_interest IS NULL OR source_path IS NULL;
