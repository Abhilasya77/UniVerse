DROP POLICY campus_event_poster_view ON storage.objects;

ALTER POLICY campus_photo_view ON storage.objects
  USING (
    bucket_id = 'campus-media'
    AND owner_id = (SELECT auth.uid())::text
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );