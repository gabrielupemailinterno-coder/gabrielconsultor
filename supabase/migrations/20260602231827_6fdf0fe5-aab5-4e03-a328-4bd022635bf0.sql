
CREATE POLICY "Mentee uploads own evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mentee-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Mentee reads own evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mentee-evidence' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Mentee deletes own evidence" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mentee-evidence' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
