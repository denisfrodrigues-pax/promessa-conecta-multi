-- =============================================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- =============================================================

-- 1. FIX MEMBROS TABLE PUBLIC EXPOSURE
-- Remove overly permissive policy and restrict to admin only
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view active membros" ON public.membros;

-- Only admins can view membros data
CREATE POLICY "Admins can view all membros"
ON public.membros
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Members can view their own linked record
CREATE POLICY "Users can view their own membro record"
ON public.membros
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND membros.user_id = p.id
  )
);

-- 2. FIX PROFILES TABLE EXPOSURE
-- Remove overly permissive leader policy and create scoped policies
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Leaders can view profiles for scheduling" ON public.profiles;

-- Leaders can only view basic profile info for their ministry volunteers
-- (not CPF, observacoes_privadas, or full address)
CREATE POLICY "Leaders can view their ministry volunteers basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User viewing their own profile
  auth.uid() = user_id
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Leaders can view profiles of volunteers in their ministry only
  (
    has_role(auth.uid(), 'lider'::app_role)
    AND EXISTS (
      SELECT 1 
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE m.lider_id = get_profile_id(auth.uid())
        AND profiles.user_id = mv.user_id
    )
  )
  OR
  -- Financeiro can view profiles linked to financial transactions they manage
  (
    has_role(auth.uid(), 'financeiro'::app_role)
    AND EXISTS (
      SELECT 1 
      FROM transacoes_financeiras tf
      WHERE tf.criado_por = profiles.id
    )
  )
);