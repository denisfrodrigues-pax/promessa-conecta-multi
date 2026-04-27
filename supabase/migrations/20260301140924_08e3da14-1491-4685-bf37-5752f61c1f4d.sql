
-- Fix ministerio_modulos: change SELECT policies from RESTRICTIVE to PERMISSIVE
-- so admin can access without ministerio_usuarios entry

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can manage modules" ON ministerio_modulos;
DROP POLICY IF EXISTS "Authenticated can view active modules" ON ministerio_modulos;
DROP POLICY IF EXISTS "Ministerio members can view ministerio_modulos" ON ministerio_modulos;
DROP POLICY IF EXISTS "Usuarios veem apenas modulos do seu ministerio" ON ministerio_modulos;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins full access modules"
  ON ministerio_modulos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated view active modules"
  ON ministerio_modulos FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE POLICY "Members view own ministry modules"
  ON ministerio_modulos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = ministerio_modulos.ministerio_id
        AND ativo = true
    )
  );
