
-- 1) Drop ALL existing policies on public.bases
DROP POLICY IF EXISTS "Admin full access on bases" ON public.bases;
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
DROP POLICY IF EXISTS "Admins can manage bases" ON public.bases;
DROP POLICY IF EXISTS "Anyone can view public active bases" ON public.bases;
DROP POLICY IF EXISTS "Members can view their linked bases" ON public.bases;
DROP POLICY IF EXISTS "Leader can view own bases" ON public.bases;
DROP POLICY IF EXISTS "Member can view linked bases" ON public.bases;
DROP POLICY IF EXISTS "Public can view active public bases" ON public.bases;

-- 2) Recreate non-recursive policies

CREATE POLICY "bases_admin_all"
ON public.bases FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "bases_leader_select_own"
ON public.bases FOR SELECT
USING (lider_id = get_profile_id(auth.uid()));

CREATE POLICY "bases_member_select_linked"
ON public.bases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bases_membros bm
    WHERE bm.base_id = bases.id
      AND bm.profile_id = get_profile_id(auth.uid())
      AND bm.status = 'ativo'
  )
);

CREATE POLICY "bases_public_active"
ON public.bases FOR SELECT
USING (status = 'ativo' AND visibilidade = 'publico');

-- 3) Ensure RLS stays enabled
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
