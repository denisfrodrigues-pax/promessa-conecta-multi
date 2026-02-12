
-- A) RPC: get_eligible_people_for_base
CREATE OR REPLACE FUNCTION public.get_eligible_people_for_base(p_base_id uuid, p_search text DEFAULT NULL)
RETURNS TABLE(id uuid, nome text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_clean_search text;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_clean_search := COALESCE(TRIM(p_search), '');

  RETURN QUERY
  SELECT p.id, p.nome, p.email
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM bases_membros bm
    WHERE bm.base_id = p_base_id
      AND bm.profile_id = p.id
      AND bm.status = 'ativo'
  )
  AND (
    v_clean_search = ''
    OR p.nome ILIKE '%' || v_clean_search || '%'
    OR p.email ILIKE '%' || v_clean_search || '%'
  )
  ORDER BY p.nome
  LIMIT 50;
END;
$function$;

-- B) RPC: leader_add_member_to_base
CREATE OR REPLACE FUNCTION public.leader_add_member_to_base(p_base_id uuid, p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized: you are not admin or leader of this base';
  END IF;

  -- Insert only if not already active (respect unique constraint)
  INSERT INTO bases_membros (base_id, profile_id, status, data_entrada)
  VALUES (p_base_id, p_profile_id, 'ativo', now())
  ON CONFLICT DO NOTHING;
END;
$function$;

-- C) RPC: leader_remove_member_from_base
CREATE OR REPLACE FUNCTION public.leader_remove_member_from_base(p_bases_membros_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_base_id uuid;
BEGIN
  v_caller_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  -- Get the base_id for this membership record
  SELECT bm.base_id INTO v_base_id
  FROM bases_membros bm
  WHERE bm.id = p_bases_membros_id;

  IF v_base_id IS NULL THEN
    RAISE EXCEPTION 'Record not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = v_base_id AND b.lider_id = v_caller_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RAISE EXCEPTION 'Unauthorized: you are not admin or leader of this base';
  END IF;

  -- Soft-delete: mark as desligado
  UPDATE bases_membros
  SET status = 'desligado', data_saida = now(), updated_at = now()
  WHERE id = p_bases_membros_id;
END;
$function$;
