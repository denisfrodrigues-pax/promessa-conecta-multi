-- Cria bucket público para assets das igrejas (logos, fotos hero, fotos de login)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-assets',
  'church-assets',
  true,
  2097152,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: leitura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'church-assets-read'
  ) THEN
    CREATE POLICY "church-assets-read" ON storage.objects
      FOR SELECT USING (bucket_id = 'church-assets');
  END IF;
END $$;

-- Policy: upload autenticado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'church-assets-upload'
  ) THEN
    CREATE POLICY "church-assets-upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'church-assets'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Policy: update autenticado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'church-assets-update'
  ) THEN
    CREATE POLICY "church-assets-update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'church-assets'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
