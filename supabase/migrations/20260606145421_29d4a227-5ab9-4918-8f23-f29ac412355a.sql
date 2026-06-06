
-- Templates: restrict reads
DROP POLICY IF EXISTS "Auth reads templates" ON public.homework_templates;
CREATE POLICY "Templates readable by admin or enrolled mentee"
ON public.homework_templates FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.mentees m WHERE m.user_id = auth.uid() AND m.plan_id = homework_templates.plan_id)
);

DROP POLICY IF EXISTS "Auth reads meeting templates" ON public.meeting_templates;
CREATE POLICY "Meeting templates readable by admin or enrolled mentee"
ON public.meeting_templates FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.mentees m WHERE m.user_id = auth.uid() AND m.plan_id = meeting_templates.plan_id)
);

-- Mentees self-update: block sensitive field changes
CREATE OR REPLACE FUNCTION public.mentees_block_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.access_mode IS DISTINCT FROM OLD.access_mode
     OR NEW.asaas_customer_id IS DISTINCT FROM OLD.asaas_customer_id
     OR NEW.asaas_payment_id IS DISTINCT FROM OLD.asaas_payment_id
     OR NEW.payment_updated_at IS DISTINCT FROM OLD.payment_updated_at
     OR NEW.started_at IS DISTINCT FROM OLD.started_at
  THEN
    RAISE EXCEPTION 'not allowed to modify restricted fields';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS mentees_block_sensitive_updates ON public.mentees;
CREATE TRIGGER mentees_block_sensitive_updates
BEFORE UPDATE ON public.mentees
FOR EACH ROW EXECUTE FUNCTION public.mentees_block_sensitive_updates();

-- search_path on queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
