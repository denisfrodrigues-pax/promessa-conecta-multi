
DROP FUNCTION IF EXISTS public.get_bases_report();

CREATE OR REPLACE FUNCTION public.get_bases_report()
 RETURNS TABLE(
   base_id uuid, nome text, status text, visibilidade text, capacidade integer,
   lider_id uuid, lider_nome text, total_membros bigint, total_visitantes bigint,
   total_membros_ativos bigint, total_visitantes_geral bigint,
   membros_em_bases_distintos bigint, visitantes_em_bases_distintos bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_membros_ativos bigint;
  v_total_visitantes bigint;
  v_membros_em_bases bigint;
  v_visitantes_em_bases bigint;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*) INTO v_total_membros_ativos FROM membros WHERE status = 'ativo';
  SELECT COUNT(*) INTO v_total_visitantes FROM visitantes;

  SELECT COUNT(DISTINCT COALESCE(bm.profile_id, bm.membro_id))
    INTO v_membros_em_bases
    FROM bases_membros bm
    WHERE bm.status = 'ativo'
      AND (bm.profile_id IS NOT NULL OR bm.membro_id IS NOT NULL);

  SELECT COUNT(DISTINCT bm.visitante_id)
    INTO v_visitantes_em_bases
    FROM bases_membros bm
    WHERE bm.visitante_id IS NOT NULL
      AND bm.status != 'desligado';

  RETURN QUERY
  SELECT
    b.id AS base_id, b.nome,
    COALESCE(b.status, 'ativo') AS status,
    COALESCE(b.visibilidade, 'publico') AS visibilidade,
    COALESCE(b.capacidade, 20) AS capacidade,
    b.lider_id,
    p.nome AS lider_nome,
    COALESCE(m_count.total, 0) AS total_membros,
    COALESCE(v_count.total, 0) AS total_visitantes,
    v_total_membros_ativos,
    v_total_visitantes,
    v_membros_em_bases,
    v_visitantes_em_bases
  FROM bases b
  LEFT JOIN profiles p ON p.id = b.lider_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.status = 'ativo'
      AND (bm.membro_id IS NOT NULL OR bm.profile_id IS NOT NULL)
  ) m_count ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total FROM bases_membros bm
    WHERE bm.base_id = b.id AND bm.visitante_id IS NOT NULL AND bm.status != 'desligado'
  ) v_count ON true
  ORDER BY b.nome;
END;
$function$;
