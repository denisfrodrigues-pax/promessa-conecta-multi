
-- Also clean up remaining redundant RESTRICTIVE write policies on ministerio_modulos
-- that overlap with the new permissive admin policy

DROP POLICY IF EXISTS "Ministerio leaders delete ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio leaders insert ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio leaders update ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios atualizam modulos apenas do seu ministerio" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios deletam modulos apenas do seu ministerio" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios inserem modulos apenas no seu ministerio" ON ministerio_modulos;

-- Recreate as PERMISSIVE for leaders
CREATE POLICY "Leaders manage own ministry modules"
  ON ministerio_modulos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );
