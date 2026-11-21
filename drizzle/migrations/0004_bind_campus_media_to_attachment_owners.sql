ALTER TABLE public.complaints
  ADD CONSTRAINT campus_complaint_photo_owner_path
  CHECK (photo = '' OR split_part(photo, '/', 1) = owner::text);

ALTER POLICY campus_event_poster_view ON storage.objects
  USING (
    bucket_id = 'campus-media'
    AND (SELECT auth.uid()) IS NOT NULL
    AND owner_id = split_part(name, '/', 1)
    AND EXISTS (
      SELECT 1 FROM public.events AS e
      WHERE e.poster = objects.name AND e.owner::text = objects.owner_id
    )
  );

ALTER POLICY campus_photo_view ON storage.objects
  USING (
    bucket_id = 'campus-media'
    AND owner_id = split_part(name, '/', 1)
    AND (
      owner_id = (SELECT auth.uid())::text
      OR (
        (SELECT auth.uid()) IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM public.items AS i
            WHERE i.photo = objects.name AND i.owner::text = objects.owner_id
          )
          OR EXISTS (
            SELECT 1 FROM public.campus_service_queue() AS q
            WHERE q.photo = objects.name
          )
        )
      )
    )
  );