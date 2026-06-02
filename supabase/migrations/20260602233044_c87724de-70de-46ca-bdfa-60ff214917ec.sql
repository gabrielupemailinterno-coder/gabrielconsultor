-- Shift via temporary offset to avoid unique conflict
UPDATE public.meeting_templates SET sequence = sequence + 100;
UPDATE public.meeting_templates SET sequence = sequence - 99;
UPDATE public.homework_templates SET meeting_sequence = meeting_sequence + 1;

INSERT INTO public.meeting_templates (plan_id, sequence, title, description)
SELECT id, 1, 'Onboarding (40 min)',
       'Encontro inicial de 40 minutos para alinhamento de expectativas, diagnóstico do ponto de partida e setup do plano de execução.'
FROM public.mentorship_plans;

UPDATE public.mentorship_plans SET total_meetings = 7;

CREATE OR REPLACE FUNCTION public.provision_mentee(_user_id uuid, _plan_id uuid, _full_name text, _email text, _phone text, _asaas_customer_id text, _asaas_payment_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _mentee_id uuid; _tpl record;
BEGIN
  INSERT INTO public.mentees (user_id, plan_id, full_name, email, phone, asaas_customer_id, asaas_payment_id, status, started_at)
  VALUES (_user_id, _plan_id, _full_name, _email, _phone, _asaas_customer_id, _asaas_payment_id, 'active', now())
  RETURNING id INTO _mentee_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentee') ON CONFLICT DO NOTHING;

  FOR _tpl IN SELECT sequence, title, description FROM public.meeting_templates WHERE plan_id = _plan_id ORDER BY sequence LOOP
    INSERT INTO public.meetings (mentee_id, sequence, title, description, status, unlocks_at)
    VALUES (
      _mentee_id, _tpl.sequence, _tpl.title, _tpl.description,
      CASE WHEN _tpl.sequence <= 2 THEN 'available' ELSE 'blocked' END,
      CASE WHEN _tpl.sequence <= 2 THEN now() ELSE now() + ((_tpl.sequence - 2) * interval '14 days') END
    );
  END LOOP;

  INSERT INTO public.homework_tasks (mentee_id, meeting_id, title, description)
  SELECT _mentee_id, mt.id, ht.title, ht.description
  FROM public.homework_templates ht
  JOIN public.meetings mt ON mt.mentee_id = _mentee_id AND mt.sequence = ht.meeting_sequence
  WHERE ht.plan_id = _plan_id
  ORDER BY ht.meeting_sequence, ht.sort_order;

  RETURN _mentee_id;
END $function$;