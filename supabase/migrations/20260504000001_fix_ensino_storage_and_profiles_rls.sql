-- Tornar bucket público para acesso direto via URL
UPDATE storage.buckets SET public = true WHERE id = 'ensino-planos';

-- Adicionar policy para todos os autenticados verem profiles (necessário para busca na chamada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_view_all_profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "authenticated_view_all_profiles" ON profiles FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;
