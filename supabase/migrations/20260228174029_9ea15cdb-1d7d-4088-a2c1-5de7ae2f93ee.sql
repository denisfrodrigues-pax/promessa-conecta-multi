
-- Make responsavel_id nullable for QR/auto public check-ins
ALTER TABLE checkins_kids ALTER COLUMN responsavel_id DROP NOT NULL;

-- RPC: public check-in by QR token
CREATE OR REPLACE FUNCTION public.public_checkin_by_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crianca record;
  v_existing record;
  v_inicio_dia timestamptz;
BEGIN
  SELECT id, nome, sala_id, igreja_id INTO v_crianca
  FROM criancas WHERE qr_token = p_token;

  IF v_crianca IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Cartão inválido ou não encontrado');
  END IF;

  v_inicio_dia := date_trunc('day', now());

  SELECT id INTO v_existing
  FROM checkins_kids
  WHERE crianca_id = v_crianca.id
    AND status = 'presente'
    AND checkin_at >= v_inicio_dia;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Esta criança já está presente hoje', 'nome', v_crianca.nome);
  END IF;

  INSERT INTO checkins_kids (crianca_id, sala_id, status, checkin_at)
  VALUES (v_crianca.id, v_crianca.sala_id, 'presente', now());

  RETURN json_build_object('success', true, 'message', 'Presença registrada', 'nome', v_crianca.nome);
END;
$$;

-- RPC: public manual check-in
CREATE OR REPLACE FUNCTION public.public_checkin_manual(p_crianca_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crianca record;
  v_existing record;
  v_inicio_dia timestamptz;
BEGIN
  SELECT id, nome, sala_id, igreja_id INTO v_crianca
  FROM criancas WHERE id = p_crianca_id;

  IF v_crianca IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Criança não encontrada');
  END IF;

  v_inicio_dia := date_trunc('day', now());

  SELECT id INTO v_existing
  FROM checkins_kids
  WHERE crianca_id = v_crianca.id
    AND status = 'presente'
    AND checkin_at >= v_inicio_dia;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Esta criança já está presente hoje', 'nome', v_crianca.nome);
  END IF;

  INSERT INTO checkins_kids (crianca_id, sala_id, status, checkin_at)
  VALUES (v_crianca.id, v_crianca.sala_id, 'presente', now());

  RETURN json_build_object('success', true, 'message', 'Presença registrada', 'nome', v_crianca.nome);
END;
$$;

-- RPC: public search criancas by igreja
CREATE OR REPLACE FUNCTION public.public_search_criancas(p_igreja_id uuid, p_search text)
RETURNS TABLE(id uuid, nome text, data_nascimento date, sala_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome, c.data_nascimento, c.sala_id
  FROM criancas c
  WHERE c.igreja_id = p_igreja_id
    AND c.nome ILIKE '%' || COALESCE(TRIM(p_search), '') || '%'
  ORDER BY c.nome
  LIMIT 20;
END;
$$;

-- RPC: public get today's presentes
CREATE OR REPLACE FUNCTION public.public_presentes_hoje(p_igreja_id uuid)
RETURNS TABLE(id uuid, checkin_at timestamptz, crianca_nome text, sala_nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ck.id, ck.checkin_at, c.nome AS crianca_nome, s.nome AS sala_nome
  FROM checkins_kids ck
  JOIN criancas c ON c.id = ck.crianca_id
  LEFT JOIN salas s ON s.id = ck.sala_id
  WHERE c.igreja_id = p_igreja_id
    AND ck.status = 'presente'
    AND ck.checkin_at >= date_trunc('day', now())
  ORDER BY ck.checkin_at DESC;
END;
$$;

-- RPC: get default igreja
CREATE OR REPLACE FUNCTION public.public_get_default_igreja()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM igrejas WHERE ativa = true ORDER BY created_at LIMIT 1;
$$;

-- Grant anon access to public RPCs
GRANT EXECUTE ON FUNCTION public.public_checkin_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_checkin_manual(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_search_criancas(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_presentes_hoje(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_default_igreja() TO anon, authenticated;
