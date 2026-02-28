
-- 1) Create helper function: checks if user is admin OR active Kids ministry volunteer
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE mv.user_id = _user_id
        AND mv.ativo = true
        AND m.ativo = true
        AND m.nome ILIKE '%kids%'
    )
$$;

-- 2) Drop the 3 overly permissive policies created previously
DROP POLICY IF EXISTS "Authenticated can view criancas for checkin" ON public.criancas;
DROP POLICY IF EXISTS "Authenticated can insert checkins_kids" ON public.checkins_kids;
DROP POLICY IF EXISTS "Authenticated can view checkins_kids" ON public.checkins_kids;
DROP POLICY IF EXISTS "Authenticated can update checkins_kids" ON public.checkins_kids;

-- Also drop the old generic salas SELECT that uses true
DROP POLICY IF EXISTS "Authenticated can view salas" ON public.salas;

-- 3) Create restrictive policies

-- criancas: SELECT for admin OR kids team
CREATE POLICY "Kids team can view criancas"
ON public.criancas
FOR SELECT
USING (is_kids_team(auth.uid()));

-- criancas: UPDATE for admin OR kids team (to assign sala_id, edit fields)
CREATE POLICY "Kids team can update criancas"
ON public.criancas
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- criancas: INSERT for admin OR kids team (cadastro rápido)
CREATE POLICY "Kids team can insert criancas"
ON public.criancas
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

-- checkins_kids: SELECT for admin OR kids team
CREATE POLICY "Kids team can view checkins_kids"
ON public.checkins_kids
FOR SELECT
USING (is_kids_team(auth.uid()));

-- checkins_kids: INSERT for admin OR kids team
CREATE POLICY "Kids team can insert checkins_kids"
ON public.checkins_kids
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

-- checkins_kids: UPDATE for admin OR kids team (checkout)
CREATE POLICY "Kids team can update checkins_kids"
ON public.checkins_kids
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- salas: SELECT for admin OR kids team
CREATE POLICY "Kids team can view salas"
ON public.salas
FOR SELECT
USING (is_kids_team(auth.uid()));
