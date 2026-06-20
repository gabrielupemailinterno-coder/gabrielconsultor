
-- Add WITH CHECK to mentees self-update policy (defense in depth alongside the existing trigger)
DROP POLICY IF EXISTS "Mentee updates self" ON public.mentees;
CREATE POLICY "Mentee updates self"
ON public.mentees
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy on storage.objects for mentee-evidence (owner-scoped by first folder = uid)
DROP POLICY IF EXISTS "Mentees can update own evidence files" ON storage.objects;
CREATE POLICY "Mentees can update own evidence files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mentee-evidence'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'mentee-evidence'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
