-- Corrige acesso de leitura à tabela ministerios para líderes/membros/voluntários.
--
-- A migração original (20251206155128) criava uma policy PERMISSIVE ampla
-- ("Anyone authenticated can view ministerios", USING (true)). Em algum
-- ponto fora do histórico de migrações rastreado neste repo, essa policy
-- foi removida do banco e substituída só pela policy "ministerios_church_isolation"
-- (RESTRICTIVE) — que nunca concede acesso por si só, apenas restringe
-- policies PERMISSIVE existentes. Como a única PERMISSIVE remanescente em
-- ministerios ("Admins and superadmin can manage ministerios") exige o
-- papel admin/superadmin, qualquer usuário sem esses papéis (líder,
-- voluntário, membro comum) passou a ver zero linhas em ministerios,
-- mesmo tendo vínculo ativo em ministerio_usuarios — quebrando o Hub do
-- Líder, MinisterioLayout e LeaderMinisterioLayout pra qualquer líder puro.
--
-- Todas as tabelas relacionadas (ministerio_modulos, mca_salas,
-- ensino_turmas, ministerio_usuarios) já têm o padrão equivalente de
-- policy PERMISSIVE de leitura pra usuários autenticados da própria
-- igreja — esta migração alinha ministerios ao mesmo padrão, mantendo
-- escrita (INSERT/UPDATE/DELETE) restrita a admin/superadmin como já era.

CREATE POLICY "Authenticated users can view ministerios of their church"
  ON public.ministerios
  FOR SELECT
  TO authenticated
  USING (
    church_id = public.get_user_church_id()
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
  );
