-- Create a SECURITY DEFINER function that allows leaders to fetch eligible volunteers
-- This bypasses RLS but has its own authorization checks

CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid, p_search_term text DEFAULT '')
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader_of_ministry boolean;
BEGIN
  -- Get caller's profile id
  v_caller_profile_id := get_profile_id(auth.uid());
  
  -- Check if caller is admin
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);
  
  -- Check if caller is the leader of this ministry
  SELECT EXISTS (
    SELECT 1 FROM ministerios m
    WHERE m.id = p_ministerio_id AND m.lider_id = v_caller_profile_id
  ) INTO v_is_leader_of_ministry;
  
  -- Authorization: must be admin or leader of this ministry
  IF NOT (v_is_admin OR v_is_leader_of_ministry) THEN
    RAISE EXCEPTION 'Unauthorized: You must be an admin or the leader of this ministry';
  END IF;
  
  -- Return eligible profiles:
  -- 1. Have schedulable roles (admin, lider, voluntario, financeiro)
  -- 2. Are NOT already linked to this ministry
  -- 3. Match search term (if provided)
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.nome,
    p.email,
    p.user_id
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role IN ('admin', 'lider', 'voluntario', 'financeiro')
    AND NOT EXISTS (
      SELECT 1 FROM ministerio_voluntarios mv
      WHERE mv.ministerio_id = p_ministerio_id
        AND mv.user_id = p.user_id
    )
    AND (
      p_search_term = '' 
      OR p.nome ILIKE '%' || p_search_term || '%'
      OR p.email ILIKE '%' || p_search_term || '%'
    )
  ORDER BY p.nome
  LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_eligible_volunteers_for_ministry(uuid, text) TO authenticated;