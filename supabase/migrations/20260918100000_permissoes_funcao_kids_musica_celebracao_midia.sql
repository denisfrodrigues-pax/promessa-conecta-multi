-- Permissões por função — Kids, Música, Celebração e Mídia.
-- Reaproveita a infraestrutura do PR #60 (ministerio_funcoes.permissoes,
-- has_funcao_permissao, get_my_funcao_permissoes) — nada da Parte 1 é
-- recriado aqui.
--
-- Padrão obrigatório em toda tabela desta migration (erro cometido e
-- corrigido no PR #60): NUNCA uma policy FOR ALL com USING amplo (qualquer
-- membro) e WITH CHECK restrito — no Postgres, DELETE só respeita USING,
-- então isso libera DELETE pra qualquer membro sem querer. Sempre: uma
-- policy FOR SELECT separada com a condição ampla (leitura preservada), e a
-- policy FOR ALL com USING igual ao WITH CHECK, os dois restritos.
--
-- Achado adicional (fora do pedido original, mas necessário pra fechar o
-- requisito "voluntário sem função continua sem acesso de escrita"): as 5
-- tabelas mca_* (mca_planos_aula, mca_plano_arquivos, mca_checkins,
-- mca_criancas, mca_responsaveis) não tinham NENHUMA restrição de líder —
-- a policy "membro_all_mca_*" já dava escrita total (INSERT/UPDATE/DELETE)
-- pra qualquer membro ativo do Kids, função ou não. Isso é anterior a este
-- trabalho (nunca foi coberto pelo hardening original da PR #56, que não
-- incluía essas tabelas). Corrigido aqui como parte da mesma migration —
-- sem isso, "voluntário sem função continua sem acesso" seria falso pra
-- Kids desde o início.

-- ── KIDS (mca) ──────────────────────────────────────────────────────────────

-- mca_planos_aula — professor só na própria sala (mca_salas.professor_id)
drop policy if exists "membro_all_mca_planos_aula" on public.mca_planos_aula;

create policy "membro_select_mca_planos_aula" on public.mca_planos_aula
as permissive for select
using (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_planos_aula.sala_id and mu.user_id = auth.uid() and mu.ativo = true
  )
);

create policy "mca_planos_aula_lider_funcao" on public.mca_planos_aula
as permissive for all
using (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_planos_aula.sala_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or (
    has_funcao_permissao(auth.uid(), (select s.ministerio_id from public.mca_salas s where s.id = mca_planos_aula.sala_id), 'mca.professor.gerenciar_sala')
    and exists (select 1 from public.mca_salas s where s.id = mca_planos_aula.sala_id and s.professor_id = get_profile_id(auth.uid()))
  )
)
with check (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_planos_aula.sala_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or (
    has_funcao_permissao(auth.uid(), (select s.ministerio_id from public.mca_salas s where s.id = mca_planos_aula.sala_id), 'mca.professor.gerenciar_sala')
    and exists (select 1 from public.mca_salas s where s.id = mca_planos_aula.sala_id and s.professor_id = get_profile_id(auth.uid()))
  )
);

-- mca_plano_arquivos — mesmo escopo do plano (via 2 hops: arquivo -> plano -> sala)
drop policy if exists "membro_all_mca_plano_arquivos" on public.mca_plano_arquivos;

create policy "membro_select_mca_plano_arquivos" on public.mca_plano_arquivos
as permissive for select
using (
  exists (
    select 1 from public.mca_planos_aula p
    join public.mca_salas s on s.id = p.sala_id
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where p.id = mca_plano_arquivos.plano_id and mu.user_id = auth.uid() and mu.ativo = true
  )
);

create policy "mca_plano_arquivos_lider_funcao" on public.mca_plano_arquivos
as permissive for all
using (
  exists (
    select 1 from public.mca_planos_aula p
    join public.mca_salas s on s.id = p.sala_id
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where p.id = mca_plano_arquivos.plano_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or exists (
    select 1 from public.mca_planos_aula p
    join public.mca_salas s on s.id = p.sala_id
    where p.id = mca_plano_arquivos.plano_id
      and has_funcao_permissao(auth.uid(), s.ministerio_id, 'mca.professor.gerenciar_sala')
      and s.professor_id = get_profile_id(auth.uid())
  )
)
with check (
  exists (
    select 1 from public.mca_planos_aula p
    join public.mca_salas s on s.id = p.sala_id
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where p.id = mca_plano_arquivos.plano_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or exists (
    select 1 from public.mca_planos_aula p
    join public.mca_salas s on s.id = p.sala_id
    where p.id = mca_plano_arquivos.plano_id
      and has_funcao_permissao(auth.uid(), s.ministerio_id, 'mca.professor.gerenciar_sala')
      and s.professor_id = get_profile_id(auth.uid())
  )
);

-- mca_checkins — checkin.qualquer_sala é sala-agnóstico por desenho (igual
-- eb.chamada.qualquer_turma no Ensino).
drop policy if exists "membro_all_mca_checkins" on public.mca_checkins;

create policy "membro_select_mca_checkins" on public.mca_checkins
as permissive for select
using (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_checkins.sala_id and mu.user_id = auth.uid() and mu.ativo = true
  )
);

create policy "mca_checkins_lider_funcao" on public.mca_checkins
as permissive for all
using (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_checkins.sala_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or has_funcao_permissao(auth.uid(), (select s.ministerio_id from public.mca_salas s where s.id = mca_checkins.sala_id), 'mca.checkin.qualquer_sala')
)
with check (
  exists (
    select 1 from public.mca_salas s
    join public.ministerio_usuarios mu on mu.ministerio_id = s.ministerio_id
    where s.id = mca_checkins.sala_id
      and mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
  )
  or has_funcao_permissao(auth.uid(), (select s.ministerio_id from public.mca_salas s where s.id = mca_checkins.sala_id), 'mca.checkin.qualquer_sala')
);

-- mca_criancas — secretaria.gerenciar é ministério inteiro, sem escopo de
-- sala. Resolve o ministério "Kids" da igreja da criança pelo slug fixo
-- (mesmo padrão de eb_matriculas/visitantes no PR #60).
drop policy if exists "membro_all_mca_criancas" on public.mca_criancas;

create policy "membro_select_mca_criancas" on public.mca_criancas
as permissive for select
using (
  exists (
    select 1 from public.ministerio_usuarios mu
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id
    where mu.user_id = auth.uid() and mu.ativo = true and s.church_id = mca_criancas.church_id
  )
);

create policy "mca_criancas_lider_funcao" on public.mca_criancas
as permissive for all
using (
  exists (
    select 1 from public.ministerio_usuarios mu
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id
    where mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
      and s.church_id = mca_criancas.church_id
  )
  or exists (
    select 1 from public.ministerios m
    where m.church_id = mca_criancas.church_id and m.slug = 'mca'
      and has_funcao_permissao(auth.uid(), m.id, 'mca.secretaria.gerenciar')
  )
)
with check (
  exists (
    select 1 from public.ministerio_usuarios mu
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id
    where mu.user_id = auth.uid() and mu.papel = 'lider'::papel_ministerial and mu.ativo = true
      and s.church_id = mca_criancas.church_id
  )
  or exists (
    select 1 from public.ministerios m
    where m.church_id = mca_criancas.church_id and m.slug = 'mca'
      and has_funcao_permissao(auth.uid(), m.id, 'mca.secretaria.gerenciar')
  )
);

-- mca_responsaveis — mesmo escopo de mca_criancas, via crianca_id.
drop policy if exists "membro_all_mca_responsaveis" on public.mca_responsaveis;

create policy "membro_select_mca_responsaveis" on public.mca_responsaveis
as permissive for select
using (
  exists (
    select 1 from public.mca_criancas c
    join public.ministerio_usuarios mu on mu.ativo = true
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id and s.church_id = c.church_id
    where c.id = mca_responsaveis.crianca_id and mu.user_id = auth.uid()
  )
);

create policy "mca_responsaveis_lider_funcao" on public.mca_responsaveis
as permissive for all
using (
  exists (
    select 1 from public.mca_criancas c
    join public.ministerio_usuarios mu on mu.papel = 'lider'::papel_ministerial and mu.ativo = true
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id and s.church_id = c.church_id
    where c.id = mca_responsaveis.crianca_id and mu.user_id = auth.uid()
  )
  or exists (
    select 1 from public.mca_criancas c
    join public.ministerios m on m.church_id = c.church_id and m.slug = 'mca'
    where c.id = mca_responsaveis.crianca_id
      and has_funcao_permissao(auth.uid(), m.id, 'mca.secretaria.gerenciar')
  )
)
with check (
  exists (
    select 1 from public.mca_criancas c
    join public.ministerio_usuarios mu on mu.papel = 'lider'::papel_ministerial and mu.ativo = true
    join public.mca_salas s on s.ministerio_id = mu.ministerio_id and s.church_id = c.church_id
    where c.id = mca_responsaveis.crianca_id and mu.user_id = auth.uid()
  )
  or exists (
    select 1 from public.mca_criancas c
    join public.ministerios m on m.church_id = c.church_id and m.slug = 'mca'
    where c.id = mca_responsaveis.crianca_id
      and has_funcao_permissao(auth.uid(), m.id, 'mca.secretaria.gerenciar')
  )
);

-- ── MÚSICA ──────────────────────────────────────────────────────────────────
-- musicas_repertorio, musicas_culto, liturgia_culto e liturgia_itens já
-- tinham policy de SELECT separada da policy de escrita líder-only (as duas
-- já eram simétricas — USING = WITH CHECK, sem a brecha de DELETE) — só
-- falta a policy de função, sem tocar nas existentes.

create policy "musicas_repertorio_funcao" on public.musicas_repertorio
as permissive for all
using (
  has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar')
  and ((church_id is null) or (church_id = get_user_church_id()))
)
with check (
  has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar')
  and ((church_id is null) or (church_id = get_user_church_id()))
);

create policy "musicas_culto_funcao" on public.musicas_culto
as permissive for all
using (has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar'))
with check (has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar'));

create policy "liturgia_culto_funcao" on public.liturgia_culto
as permissive for all
using (has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar'))
with check (has_funcao_permissao(auth.uid(), ministerio_id, 'musica.liturgia.gerenciar'));

create policy "liturgia_itens_funcao" on public.liturgia_itens
as permissive for all
using (
  exists (
    select 1 from public.liturgia_culto lc
    where lc.id = liturgia_itens.liturgia_id
      and has_funcao_permissao(auth.uid(), lc.ministerio_id, 'musica.liturgia.gerenciar')
  )
)
with check (
  exists (
    select 1 from public.liturgia_culto lc
    where lc.id = liturgia_itens.liturgia_id
      and has_funcao_permissao(auth.uid(), lc.ministerio_id, 'musica.liturgia.gerenciar')
  )
);

-- ── CELEBRAÇÃO ──────────────────────────────────────────────────────────────
-- avisos_culto já tinha SELECT separado do líder-only — só falta a função.
-- Não mexe na tabela "avisos" (o cadastro de avisos em si, fora do escopo
-- pedido — "Novo Aviso" continua líder-only; a função só gerencia quais
-- avisos já existentes entram em cada culto, via avisos_culto).

create policy "avisos_culto_funcao" on public.avisos_culto
as permissive for all
using (has_funcao_permissao(auth.uid(), ministerio_id, 'celebracao.avisos.gerenciar'))
with check (has_funcao_permissao(auth.uid(), ministerio_id, 'celebracao.avisos.gerenciar'));

-- ── MÍDIA ───────────────────────────────────────────────────────────────────
-- ministerio_documentos já separava INSERT/DELETE (líder-only) de SELECT
-- (membro amplo) em policies de comando único — já era o padrão correto,
-- só falta adicionar a função ao lado do líder.

create policy "ministerio_documentos_insert_funcao" on public.ministerio_documentos
as permissive for insert
with check (has_funcao_permissao(auth.uid(), ministerio_id, 'midia.documentos.gerenciar'));

create policy "ministerio_documentos_delete_funcao" on public.ministerio_documentos
as permissive for delete
using (has_funcao_permissao(auth.uid(), ministerio_id, 'midia.documentos.gerenciar'));

-- Storage do bucket "documentos" — mesmo mecanismo já usado pro líder
-- (documentos_leader_upload_own_ministerio / documentos_leader_delete_own_ministerio),
-- estendido pra função. has_funcao_permissao já cobre líder/admin também,
-- então estas novas policies só adicionam o caminho de função — as
-- policies de líder existentes continuam intactas e não são tocadas.
create policy "documentos_funcao_upload_own_ministerio" on storage.objects
as permissive for insert
with check (
  bucket_id = 'documentos'
  and (storage.foldername(name))[1] = 'ministerios'
  and has_funcao_permissao(auth.uid(), ((storage.foldername(name))[2])::uuid, 'midia.documentos.gerenciar')
);

create policy "documentos_funcao_delete_own_ministerio" on storage.objects
as permissive for delete
using (
  bucket_id = 'documentos'
  and (storage.foldername(name))[1] = 'ministerios'
  and has_funcao_permissao(auth.uid(), ((storage.foldername(name))[2])::uuid, 'midia.documentos.gerenciar')
);
