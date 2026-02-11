
CREATE OR REPLACE FUNCTION public.get_my_bases()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid;
  result json;
BEGIN
  v_profile_id := get_profile_id(auth.uid());
  IF v_profile_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', bm.id,
      'base_id', bm.base_id,
      'profile_id', bm.profile_id,
      'data_entrada', bm.data_entrada,
      'status', bm.status,
      'bases', json_build_object(
        'id', b.id,
        'nome', b.nome,
        'descricao', b.descricao,
        'local', b.local,
        'dia_semana', b.dia_semana,
        'horario', b.horario,
        'capacidade', b.capacidade,
        'lider_id', b.lider_id,
        'foto_url', b.foto_url,
        'anfitrioes', b.anfitrioes,
        'lider', CASE WHEN b.lider_id IS NOT NULL THEN
          json_build_object('nome', (SELECT p.nome FROM profiles p WHERE p.id = b.lider_id))
        ELSE NULL END
      )
    )
  )
  INTO result
  FROM bases_membros bm
  JOIN bases b ON b.id = bm.base_id
  WHERE bm.profile_id = v_profile_id
    AND bm.status = 'ativo';

  RETURN COALESCE(result, '[]'::json);
END;
$$;
