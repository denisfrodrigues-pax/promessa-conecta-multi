
-- 1. Sync existing data: set profile_id from membros.user_id where missing
UPDATE bases_membros bm
SET profile_id = m.user_id
FROM membros m
WHERE bm.membro_id = m.id
  AND m.user_id IS NOT NULL
  AND bm.profile_id IS NULL;

-- 2. Add RLS policy on bases so members can see bases they belong to
CREATE POLICY "Members can view their linked bases"
ON public.bases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bases_membros
    WHERE bases_membros.base_id = bases.id
      AND bases_membros.status = 'ativo'
      AND bases_membros.profile_id = get_profile_id(auth.uid())
  )
);
