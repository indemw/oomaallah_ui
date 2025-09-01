-- Allow all users to read module activation settings
DO $$ BEGIN
IF NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Everyone can view module settings'
) THEN
  CREATE POLICY "Everyone can view module settings"
  ON public.app_settings
  FOR SELECT
  USING (key = 'modules');
END IF;
END $$;

-- Seed default module settings if missing
INSERT INTO public.app_settings (key, value)
VALUES ('modules', '{"reservations": true, "restaurant": true, "front_office": true, "conference": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;