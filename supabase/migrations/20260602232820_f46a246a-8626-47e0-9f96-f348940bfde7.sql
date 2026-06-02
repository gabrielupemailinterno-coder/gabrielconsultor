DO $$
DECLARE _uid uuid; _plan uuid; _email text := 'gabrielvieira.pl@gmail.com';
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = _email LIMIT 1;
  SELECT id INTO _plan FROM public.mentorship_plans WHERE active = true ORDER BY created_at LIMIT 1;
  IF _uid IS NOT NULL AND _plan IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.mentees WHERE user_id = _uid) THEN
    PERFORM public.provision_mentee(_uid, _plan, 'Gabriel Vieira (Teste)', _email, NULL, NULL, NULL);
  END IF;
END $$;