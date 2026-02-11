
-- Drop ALL existing policies on bases to eliminate recursion
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
DROP POLICY IF EXISTS "Admins can manage bases" ON public.bases;
DROP POLICY IF EXISTS "Anyone can view public active bases" ON public.bases;
DROP POLICY IF EXISTS "Members can view their linked bases" ON public.bases;

-- Recreate clean policies (NO subquery referencing bases itself)

-- 1. Admin full access
CREATE POLICY "Admin full access on bases"
ON public.bases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Leader can view bases they lead (direct column check, no subquery)
CREATE POLICY "Leader can view own bases"
ON public.bases FOR SELECT
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND lider_id = get_profile_id(auth.uid())
);

-- 3. Member can view bases they belong to (subquery on bases_membros only)
CREATE POLICY "Member can view linked bases"
ON public.bases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bases_membros bm
    WHERE bm.base_id = bases.id
      AND bm.profile_id IS NOT NULL
      AND bm.profile_id = get_profile_id(auth.uid())
      AND bm.status = 'ativo'
  )
);

-- 4. Public can view active public bases (no subquery needed)
CREATE POLICY "Public can view active public bases"
ON public.bases FOR SELECT
USING (status = 'ativo' AND visibilidade = 'publico');

-- Also fix bases_membros leader policy that references bases (causes recursion chain)
DROP POLICY IF EXISTS "Leaders can manage their base members" ON public.bases_membros;

CREATE POLICY "Leaders can manage their base members"
ON public.bases_membros FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND base_id IN (
    SELECT bm2.base_id FROM bases_membros bm2
    WHERE bm2.profile_id = get_profile_id(auth.uid())
    AND bm2.status = 'ativo'
  )
);
