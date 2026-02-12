
-- Fix the circular dependency: bases_membros policy references bases table

-- Drop the problematic policy on bases_membros
DROP POLICY IF EXISTS "Users can view their own base membership" ON public.bases_membros;

-- Recreate without referencing bases table
-- Leaders check via bases_membros itself (their own profile_id link), not via bases.lider_id
CREATE POLICY "Users can view their own base membership"
ON public.bases_membros FOR SELECT
USING (
  profile_id = get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT bm2.base_id
      FROM public.bases_membros bm2
      WHERE bm2.profile_id = get_profile_id(auth.uid())
        AND bm2.status = 'ativo'
    )
  )
);
