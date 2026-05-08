-- Remove políticas que causavam recursão infinita entre ensino_checkins e ensino_presencas.
-- Cadeia: ensino_turmas → user_turmas_com_presenca → ensino_checkins
--         → user_own_ensino_checkins → ensino_presencas
--         → membro_all_ensino_presencas → ensino_checkins → loop
--
-- A feature "Meu Ensino" usa get_meu_ensino() (SECURITY DEFINER) que não passa por RLS,
-- portanto essas políticas são redundantes e apenas causam recursão.
DROP POLICY IF EXISTS "user_turmas_com_presenca" ON ensino_turmas;
DROP POLICY IF EXISTS "user_own_ensino_checkins" ON ensino_checkins;
DROP POLICY IF EXISTS "user_own_ensino_presencas" ON ensino_presencas;
