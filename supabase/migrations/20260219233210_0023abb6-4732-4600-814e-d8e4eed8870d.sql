
-- Fase 4: Atualizar RPC get_eligible_volunteers_for_ministry para modelo híbrido

CREATE OR REPLACE FUNCTION public.get_eligible_volunteers_for_ministry(p_ministerio_id uuid, p_search_term text DEFAULT ''::text)
 RETURNS TABLE(id uuid, nome text, email text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clean_search text;
BEGIN
  -- Autorização via can_ministry (híbrido: ministerio_usuarios + ministerios.lider_id)
  IF NOT can_ministry(auth.uid(), 'write', p_ministerio_id) THEN
    RAISE EXCEPTION 'Unauthorized: You must be an admin or leader of this ministry';
  END IF;

  v_clean_search := COALESCE(TRIM(p_search_term), '');

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
      SELECT 1 FROM ministerio_usuarios mu
      WHERE mu.ministerio_id = p_ministerio_id
        AND mu.user_id = p.user_id
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
