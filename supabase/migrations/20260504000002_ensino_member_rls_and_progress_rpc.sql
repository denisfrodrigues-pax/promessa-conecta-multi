-- Permite que o usuário veja suas próprias presenças
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_own_ensino_presencas' AND tablename = 'ensino_presencas') THEN
    CREATE POLICY "user_own_ensino_presencas" ON ensino_presencas FOR SELECT TO authenticated
      USING (
        perfil_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
      );
  END IF;
END $$;

-- Permite que o usuário veja os checkins onde tem presenças
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_own_ensino_checkins' AND tablename = 'ensino_checkins') THEN
    CREATE POLICY "user_own_ensino_checkins" ON ensino_checkins FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM ensino_presencas ep
          JOIN profiles p ON p.id = ep.perfil_id
          WHERE ep.checkin_id = ensino_checkins.id AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Permite que o usuário veja as turmas onde tem presença
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_turmas_com_presenca' AND tablename = 'ensino_turmas') THEN
    CREATE POLICY "user_turmas_com_presenca" ON ensino_turmas FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM ensino_checkins ec
          JOIN ensino_presencas ep ON ep.checkin_id = ec.id
          JOIN profiles p ON p.id = ep.perfil_id
          WHERE ec.turma_id = ensino_turmas.id AND p.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RPC para buscar progresso do membro no ensino
CREATE OR REPLACE FUNCTION get_meu_ensino()
RETURNS TABLE (
  turma_id   uuid,
  turma_nome text,
  data_aula  date,
  presente   boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_perfil_id uuid;
BEGIN
  SELECT id INTO v_perfil_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_perfil_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ec.turma_id,
    et.nome AS turma_nome,
    ec.data AS data_aula,
    ep.presente
  FROM ensino_presencas ep
  JOIN ensino_checkins ec ON ec.id = ep.checkin_id
  JOIN ensino_turmas et ON et.id = ec.turma_id
  WHERE ep.perfil_id = v_perfil_id
  ORDER BY ec.data DESC;
END;
$$;
