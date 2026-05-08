-- Reescreve políticas de ensino usando has_role (SECURITY DEFINER) como o resto do sistema
-- Motivo: subquery direta em user_roles fica sujeita a RLS e bloqueava admins

-- ensino_turmas
DROP POLICY IF EXISTS "admin_all_ensino_turmas" ON ensino_turmas;
DROP POLICY IF EXISTS "lider_all_ensino_turmas" ON ensino_turmas;
DROP POLICY IF EXISTS "membro_select_ensino_turmas" ON ensino_turmas;

CREATE POLICY "admin_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "lider_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (can_ministry(auth.uid(), 'write'::text, ministerio_id))
  WITH CHECK (can_ministry(auth.uid(), 'write'::text, ministerio_id));

CREATE POLICY "membro_select_ensino_turmas" ON ensino_turmas FOR SELECT TO authenticated
  USING (check_ministerio_member(auth.uid(), ministerio_id));

-- ensino_planos_aula
DROP POLICY IF EXISTS "admin_all_ensino_planos" ON ensino_planos_aula;
DROP POLICY IF EXISTS "membro_all_ensino_planos" ON ensino_planos_aula;

CREATE POLICY "admin_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_turmas t
    WHERE t.id = ensino_planos_aula.turma_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), t.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_turmas t
    WHERE t.id = ensino_planos_aula.turma_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, t.ministerio_id))
  ));

-- ensino_plano_arquivos
DROP POLICY IF EXISTS "admin_all_ensino_arquivos" ON ensino_plano_arquivos;
DROP POLICY IF EXISTS "membro_all_ensino_arquivos" ON ensino_plano_arquivos;

CREATE POLICY "admin_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    WHERE p.id = ensino_plano_arquivos.plano_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), t.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    WHERE p.id = ensino_plano_arquivos.plano_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, t.ministerio_id))
  ));

-- ensino_checkins
DROP POLICY IF EXISTS "admin_all_ensino_checkins" ON ensino_checkins;
DROP POLICY IF EXISTS "membro_all_ensino_checkins" ON ensino_checkins;

CREATE POLICY "admin_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (check_ministerio_member(auth.uid(), ministerio_id))
  WITH CHECK (can_ministry(auth.uid(), 'write'::text, ministerio_id));

-- ensino_presencas
DROP POLICY IF EXISTS "admin_all_ensino_presencas" ON ensino_presencas;
DROP POLICY IF EXISTS "membro_all_ensino_presencas" ON ensino_presencas;

CREATE POLICY "admin_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "membro_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    WHERE ck.id = ensino_presencas.checkin_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR check_ministerio_member(auth.uid(), ck.ministerio_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    WHERE ck.id = ensino_presencas.checkin_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR can_ministry(auth.uid(), 'write'::text, ck.ministerio_id))
  ));
