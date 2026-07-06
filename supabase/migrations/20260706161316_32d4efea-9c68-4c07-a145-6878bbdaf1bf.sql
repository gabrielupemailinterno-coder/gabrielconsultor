ALTER TABLE public.score_profiles
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS cora_customer_id text,
ADD COLUMN IF NOT EXISTS cora_subscription_id text,
ADD COLUMN IF NOT EXISTS cora_invoice_id text,
ADD COLUMN IF NOT EXISTS cora_status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS cora_due_date date,
ADD COLUMN IF NOT EXISTS cora_emv text,
ADD COLUMN IF NOT EXISTS cora_qr_code_url text,
ADD COLUMN IF NOT EXISTS cora_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS cora_paid_amount integer,
ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- GRANTs already exist from original migration; no need to re-grant since we only altered the table.
