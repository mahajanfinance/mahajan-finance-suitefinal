
DROP POLICY "Anon can insert applications" ON public.service_applications;
CREATE POLICY "Anon can insert applications" ON public.service_applications FOR INSERT TO anon WITH CHECK (user_id IS NULL AND service_name IS NOT NULL);
