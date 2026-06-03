-- Coluna cultos_config para configuração dinâmica de cultos/encontros
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS cultos_config jsonb DEFAULT '{}';
NOTIFY pgrst, 'reload schema';

-- Corrigir RLS de ministerios para permitir superadmin inserir/gerenciar
DROP POLICY IF EXISTS "Admins can manage ministerios" ON ministerios;
DROP POLICY IF EXISTS "Admins and superadmin can manage ministerios" ON ministerios;

CREATE POLICY "Admins and superadmin can manage ministerios"
  ON ministerios FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role::text = 'superadmin'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role::text = 'superadmin'
    )
  );

-- Corrigir RLS de categorias_financeiras para permitir superadmin
DROP POLICY IF EXISTS "Admins can manage categorias_financeiras" ON categorias_financeiras;
DROP POLICY IF EXISTS "Admins can manage financial categories" ON categorias_financeiras;
DROP POLICY IF EXISTS "Admins and superadmin can manage categorias" ON categorias_financeiras;

CREATE POLICY "Admins and superadmin can manage categorias"
  ON categorias_financeiras FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role::text = 'superadmin'
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role::text = 'superadmin'
    )
  );
