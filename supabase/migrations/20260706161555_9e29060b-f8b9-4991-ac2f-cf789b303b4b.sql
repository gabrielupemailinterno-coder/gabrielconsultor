CREATE OR REPLACE FUNCTION public.handle_new_scoreapp_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'source') = 'scoreapp' THEN
    INSERT INTO public.score_profiles (
      user_id, full_name, email, phone,
      cpf, postal_code, address, address_number, address_complement, province, city, state,
      profession, experience_level, lead_origin, segment, accepted_terms_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name',''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'cpf',
      NEW.raw_user_meta_data->>'postal_code',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'address_number',
      NEW.raw_user_meta_data->>'address_complement',
      NEW.raw_user_meta_data->>'province',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'state',
      NEW.raw_user_meta_data->>'profession',
      NEW.raw_user_meta_data->>'experience_level',
      NEW.raw_user_meta_data->>'lead_origin',
      NEW.raw_user_meta_data->>'segment',
      CASE WHEN (NEW.raw_user_meta_data->>'accepted_terms')::boolean THEN now() ELSE NULL END
    ) ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      cpf = COALESCE(public.score_profiles.cpf, EXCLUDED.cpf),
      postal_code = COALESCE(public.score_profiles.postal_code, EXCLUDED.postal_code),
      address = COALESCE(public.score_profiles.address, EXCLUDED.address),
      address_number = COALESCE(public.score_profiles.address_number, EXCLUDED.address_number),
      address_complement = COALESCE(public.score_profiles.address_complement, EXCLUDED.address_complement),
      province = COALESCE(public.score_profiles.province, EXCLUDED.province),
      city = COALESCE(public.score_profiles.city, EXCLUDED.city),
      state = COALESCE(public.score_profiles.state, EXCLUDED.state),
      profession = EXCLUDED.profession,
      experience_level = EXCLUDED.experience_level,
      lead_origin = EXCLUDED.lead_origin,
      segment = EXCLUDED.segment,
      accepted_terms_at = EXCLUDED.accepted_terms_at;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'scoreapp_user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;