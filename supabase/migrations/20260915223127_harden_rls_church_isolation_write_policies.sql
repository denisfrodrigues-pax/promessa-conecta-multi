-- FRENTE A: remove policies ALL genéricas de "*_church_isolation" (que hoje concedem
-- INSERT/UPDATE/DELETE a qualquer authenticated da mesma igreja, não só SELECT),
-- substituindo por SELECT amplo (mantido) + policies de escrita restritas ao papel correto,
-- mapeadas a partir do uso real no frontend (líder em bases/visitantes/notificações,
-- membro/voluntário em membros/perfil).

-- 1) bases ---------------------------------------------------------------
drop policy if exists "bases_church_isolation" on public.bases;

create policy "bases_church_isolation_select" on public.bases
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- líder gerencia (insert/update/delete) apenas as bases das quais é o líder
-- (confirmado em LeaderBaseDetalhes.tsx: front-end já valida lider_id = profile.id;
-- GruposHub.tsx sempre grava lider_id = profile?.id no insert)
create policy "bases_leader_manage_own" on public.bases
  for all to authenticated
  using (has_role(auth.uid(), 'lider'::app_role) and lider_id = get_profile_id(auth.uid()) and ((church_id is null) or (church_id = get_user_church_id())))
  with check (has_role(auth.uid(), 'lider'::app_role) and lider_id = get_profile_id(auth.uid()) and ((church_id is null) or (church_id = get_user_church_id())));

-- 2) devocionais -----------------------------------------------------------
drop policy if exists "devocionais_church_isolation" on public.devocionais;

create policy "devocionais_church_isolation_select" on public.devocionais
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 3) eb_matriculas -----------------------------------------------------------
drop policy if exists "eb_matriculas_church_isolation" on public.eb_matriculas;

create policy "eb_matriculas_church_isolation_select" on public.eb_matriculas
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 4) eb_presencas -----------------------------------------------------------
drop policy if exists "eb_presencas_church_isolation" on public.eb_presencas;

create policy "eb_presencas_church_isolation_select" on public.eb_presencas
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 5) escalas -----------------------------------------------------------
drop policy if exists "escalas_church_isolation" on public.escalas;

create policy "escalas_church_isolation_select" on public.escalas
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 6) eventos -----------------------------------------------------------
drop policy if exists "eventos_church_isolation" on public.eventos;

create policy "eventos_church_isolation_select" on public.eventos
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 7) grupos -----------------------------------------------------------
drop policy if exists "grupos_church_isolation" on public.grupos;

create policy "grupos_church_isolation_select" on public.grupos
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 8) igreja_eventos_semanais -----------------------------------------------------------
-- já existe "igreja_eventos_semanais_church_isolation" (SELECT, mesma condição) —
-- só remove a policy ALL redundante/perigosa.
drop policy if exists "eventos_semanais_church_isolation" on public.igreja_eventos_semanais;

-- 9) membros -----------------------------------------------------------
drop policy if exists "membros_church_isolation" on public.membros;

create policy "membros_church_isolation_select" on public.membros
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- usuário comum (membro/voluntário) pode atualizar o PRÓPRIO registro de membro
-- (confirmado em member/Perfil.tsx: self-service de dados pessoais)
create policy "membros_self_update" on public.membros
  for update to authenticated
  using (user_id is not null and exists (select 1 from public.profiles p where p.user_id = auth.uid() and membros.user_id = p.id))
  with check (user_id is not null and exists (select 1 from public.profiles p where p.user_id = auth.uid() and membros.user_id = p.id));

-- 10) ministerios -----------------------------------------------------------
drop policy if exists "ministerios_church_isolation" on public.ministerios;

create policy "ministerios_church_isolation_select" on public.ministerios
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- 11) notificacoes -----------------------------------------------------------
drop policy if exists "notificacoes_church_isolation" on public.notificacoes;

create policy "notificacoes_church_isolation_select" on public.notificacoes
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- líder pode excluir notificações endereçadas a voluntários da própria equipe/ministério.
-- Nota: notificacoes.voluntario_id referencia profiles.id (FK), enquanto
-- ministerio_usuarios.user_id guarda o auth.users.id — por isso o join intermediário
-- por profiles.user_id (a policy de SELECT pré-existente "Leaders can view ministry
-- volunteers notifications" tem esse mesmo descasamento e nunca bateu de fato; corrigido
-- aqui só na policy nova, sem alterar a policy de SELECT pré-existente).
create policy "notificacoes_leader_delete_ministry" on public.notificacoes
  for delete to authenticated
  using (
    has_role(auth.uid(), 'lider'::app_role)
    and voluntario_id in (
      select p.id
      from public.ministerio_usuarios mv
      join public.ministerios m on mv.ministerio_id = m.id
      join public.profiles p on p.user_id = mv.user_id
      where m.lider_id = get_profile_id(auth.uid())
    )
  );

-- 12) visitantes -----------------------------------------------------------
drop policy if exists "visitantes_church_isolation" on public.visitantes;

create policy "visitantes_church_isolation_select" on public.visitantes
  for select to authenticated
  using ((church_id is null) or (church_id = get_user_church_id()) or has_role(auth.uid(), 'superadmin'::app_role));

-- líder gerencia (update/delete/insert manual pela recepção) visitantes da própria igreja
-- (confirmado em leader/recepcao/VisitantesDia.tsx e VisitantesHistorico.tsx — check-in,
-- atualização de status, remoção; não há campo de "dono" do visitante, é por igreja)
create policy "visitantes_leader_manage" on public.visitantes
  for all to authenticated
  using (has_role(auth.uid(), 'lider'::app_role) and ((church_id is null) or (church_id = get_user_church_id())))
  with check (has_role(auth.uid(), 'lider'::app_role) and ((church_id is null) or (church_id = get_user_church_id())));

-- 13) configuracoes_instituicao -----------------------------------------------------------
-- SEM MUDANÇA: já tinha "configuracoes_instituicao_church_isolation" com cmd SELECT
-- (não ALL) — confirmado via pg_policies antes desta migration. Tabela já estava correta.

-- FRENTE A (achado relacionado): profiles precisa de SELECT amplo por igreja para
-- corrigir o card "aniversariantes da semana" para voluntário/membro comum.
-- Limitação documentada: RLS é por linha, não por coluna — esta policy expõe também
-- colunas sensíveis (cpf, endereco, observacoes_privadas, cep/logradouro/bairro/cidade/uf,
-- naturalidade, estado_civil, sexo, pcd, grau_instrucao, formacao, profissao) a qualquer
-- autenticado da mesma igreja. Ver relatório para recomendação de mitigação futura
-- (view pública com só as colunas necessárias, ou tabela profiles_public separada).
create policy "profiles_church_members_select" on public.profiles
  for select to authenticated
  using ((church_id is not null) and (church_id = get_user_church_id()));
