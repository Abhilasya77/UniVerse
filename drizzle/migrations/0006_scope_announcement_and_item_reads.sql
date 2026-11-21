CREATE OR REPLACE FUNCTION public.campus_same_university(other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles a, public.profiles b
    WHERE a.id = auth.uid() AND b.id = other
      AND btrim(a.university) <> ''
      AND lower(btrim(a.university)) = lower(btrim(b.university))
  )
$$;
REVOKE ALL ON FUNCTION public.campus_same_university(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campus_same_university(uuid) TO authenticated;

DROP POLICY IF EXISTS announcements_read ON public.announcements;
CREATE POLICY announcements_read ON public.announcements FOR SELECT TO authenticated
USING (owner = (SELECT auth.uid()) OR public.campus_same_university(owner));

DROP POLICY IF EXISTS items_read ON public.items;
CREATE POLICY items_read ON public.items FOR SELECT TO authenticated
USING (
  owner = (SELECT auth.uid())
  OR status = 'Open'
  OR EXISTS (SELECT 1 FROM public.messages m WHERE m.item_id = items.id
             AND (m.sender = (SELECT auth.uid()) OR m.recipient = (SELECT auth.uid())))
);