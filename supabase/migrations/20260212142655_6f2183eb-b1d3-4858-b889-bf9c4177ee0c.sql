
-- =============================================
-- RPC 1: get_bases_report (Admin only)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_bases_report()
RETURNS TABLE (
  base_id uuid,
  nome text,
  status text,
  visibilidade text,
  capacidade integer,
  lider_id uuid,
  lider_nome text,
  total_membros bigint,
  total_visitantes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id AS base_id,
    b.nome,
    COALESCE(b.status, 'ativo') AS status,
    COALESCE(b.visibilidade, 'publico') AS visibilidade,
    COALESCE(b.capacidade, 20) AS capacidade,
    b.lider_id,
    p.nome AS lider_nome,
    COALESCE(m_count.total, 0) AS total_membros,
    COALESCE(v_count.total, 0) AS total_visitantes
  FROM bases b
  LEFT JOIN profiles p ON p.id = b.lider_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total
    FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.status = 'ativo' AND (bm.membro_id IS NOT NULL OR bm.profile_id IS NOT NULL)
  ) m_count ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total
    FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.visitante_id IS NOT NULL AND bm.status != 'desligado'
  ) v_count ON true
  ORDER BY b.nome;
END;
$$;

-- =============================================
-- RPC 2: get_base_members_for_leader(p_base_id, p_search)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_base_members_for_leader(
  p_base_id uuid,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  bases_membros_id uuid,
  profile_id uuid,
  membro_id uuid,
  nome text,
  telefone text,
  foto_url text,
  origem text,
  data_entrada timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid;
  v_is_admin boolean;
  v_is_leader boolean;
  v_clean_search text;
BEGIN
  v_profile_id := get_profile_id(auth.uid());
  v_is_admin := has_role(auth.uid(), 'admin'::app_role);

  -- Check if caller is leader of this base
  SELECT EXISTS (
    SELECT 1 FROM bases b WHERE b.id = p_base_id AND b.lider_id = v_profile_id
  ) INTO v_is_leader;

  IF NOT (v_is_admin OR v_is_leader) THEN
    RETURN; -- Return empty set
  END IF;

  v_clean_search := COALESCE(TRIM(p_search), '');

  RETURN QUERY
  SELECT
    bm.id AS bases_membros_id,
    bm.profile_id,
    bm.membro_id,
    COALESCE(pr.nome, me.nome, 'Sem nome') AS nome,
    COALESCE(pr.telefone, me.telefone) AS telefone,
    COALESCE(pr.foto_url, me.foto_perfil) AS foto_url,
    CASE
      WHEN bm.profile_id IS NOT NULL AND bm.membro_id IS NOT NULL THEN 'ambos'
      WHEN bm.profile_id IS NOT NULL THEN 'profile'
      WHEN bm.membro_id IS NOT NULL THEN 'membro'
      ELSE 'desconhecido'
    END AS origem,
    bm.data_entrada
  FROM bases_membros bm
  LEFT JOIN profiles pr ON pr.id = bm.profile_id
  LEFT JOIN membros me ON me.id = bm.membro_id
  WHERE bm.base_id = p_base_id
    AND bm.status = 'ativo'
    AND (bm.profile_id IS NOT NULL OR bm.membro_id IS NOT NULL)
    AND (
      v_clean_search = ''
      OR COALESCE(pr.nome, me.nome, '') ILIKE '%' || v_clean_search || '%'
    )
  ORDER BY COALESCE(pr.nome, me.nome);
END;
$$;
