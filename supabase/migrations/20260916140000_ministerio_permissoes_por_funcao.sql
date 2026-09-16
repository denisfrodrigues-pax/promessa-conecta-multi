-- Permissões por função dentro de ministérios.
--
-- Até aqui, ministerio_funcoes era só uma etiqueta visual: um voluntário podia
-- ter uma ou mais funções atribuídas (ministerio_voluntarios_funcoes), mas
-- nenhuma tela ou policy de RLS consultava isso — só líder/admin tinham
-- qualquer acesso de escrita. Esta migration conecta função -> permissão real.

-- ── PARTE 1: INFRAESTRUTURA ─────────────────────────────────────────────────

alter table public.ministerio_funcoes
  add column if not exists permissoes text[] not null default '{}';

-- Retorna true se o usuário tiver, no ministério informado, pelo menos uma
-- função ativa (via ministerio_voluntarios_funcoes, com ministerio_usuarios e
-- a própria função ativos) cujo array de permissões contenha _permissao.
-- Admin/superadmin e o líder do ministério sempre retornam true (mesma lógica
-- de can_ministry), pra não quebrar o acesso que já têm.
create or replace function public.has_funcao_permissao(_user_id uuid, _ministerio_id uuid, _permissao text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    (
      has_role(_user_id, 'admin'::app_role)
      and exists (select 1 from public.ministerios m where m.id = _ministerio_id and m.church_id = get_user_church_id())
    )
    or has_role(_user_id, 'superadmin'::app_role)
    or exists (
      select 1 from public.ministerios m
      join public.profiles p on p.id = m.lider_id
      where m.id = _ministerio_id and p.user_id = _user_id
    )
    or exists (
      select 1
      from public.ministerio_usuarios mu
      join public.ministerio_voluntarios_funcoes mvf on mvf.ministerio_voluntario_id = mu.id
      join public.ministerio_funcoes mf on mf.id = mvf.funcao_id
      where mu.user_id = _user_id
        and mu.ministerio_id = _ministerio_id
        and mu.ativo = true
        and mf.ativo = true
        and _permissao = any(mf.permissoes)
    );
$$;

-- Utilitário pro frontend: todas as permissões (via função) que o usuário
-- logado tem num ministério, num round-trip só — usado pra decidir o que
-- mostrar/habilitar nas telas (a garantia real de acesso continua sendo a
-- RLS acima, isto aqui é só pra UI não mostrar botão que vai ser bloqueado).
-- Não inclui o caso líder/admin (eles já têm acesso total nas telas de
-- líder por outro caminho, não precisam de permissoes[] pra nada).
create or replace function public.get_my_funcao_permissoes(_ministerio_id uuid)
returns text[]
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(array_agg(distinct perm), '{}')
  from public.ministerio_usuarios mu
  join public.ministerio_voluntarios_funcoes mvf on mvf.ministerio_voluntario_id = mu.id
  join public.ministerio_funcoes mf on mf.id = mvf.funcao_id
  cross join lateral unnest(mf.permissoes) as perm
  where mu.user_id = auth.uid()
    and mu.ministerio_id = _ministerio_id
    and mu.ativo = true
    and mf.ativo = true;
$$;

-- ── PARTE 2: CATÁLOGO DESTA RODADA (Ensino + Recepção) ──────────────────────

-- Professor(a) EB já existe em todas as igrejas (criada pelo fn_seed_nova_igreja).
update public.ministerio_funcoes f
set permissoes = array['eb.professor.gerenciar_turma']
from public.ministerios m
where f.ministerio_id = m.id
  and m.slug = 'ensino'
  and f.nome = 'Professor(a) EB';

-- Auxiliar e Secretaria são novas — criadas em todas as igrejas existentes,
-- uma por ministério "ensino", do mesmo jeito que fn_seed_nova_igreja cria as
-- funções padrão (set-based: cobre Convergência/Radiação/Red e qualquer outra
-- igreja que já exista, sem precisar listar id por id).
insert into public.ministerio_funcoes (ministerio_id, nome, descricao, permissoes, church_id)
select m.id, 'Auxiliar', 'Faz chamada em qualquer turma do Ensino, sem gerenciar conteúdo de aula nem matrícula.',
       array['eb.chamada.qualquer_turma'], m.church_id
from public.ministerios m
where m.slug = 'ensino'
  and not exists (
    select 1 from public.ministerio_funcoes f where f.ministerio_id = m.id and f.nome = 'Auxiliar'
  );

insert into public.ministerio_funcoes (ministerio_id, nome, descricao, permissoes, church_id)
select m.id, 'Secretaria', 'Gerencia matrículas e visualiza relatórios de presença da Escola Bíblica, sem editar conteúdo de aula.',
       array['eb.secretaria.gerenciar'], m.church_id
from public.ministerios m
where m.slug = 'ensino'
  and not exists (
    select 1 from public.ministerio_funcoes f where f.ministerio_id = m.id and f.nome = 'Secretaria'
  );

-- Recepcionista já existe em todas as igrejas — só ganha a permissão.
update public.ministerio_funcoes f
set permissoes = array['recepcao.visitantes.gerenciar']
from public.ministerios m
where f.ministerio_id = m.id
  and m.slug = 'recepcao'
  and f.nome = 'Recepcionista';

-- ── PARTE 3: RLS — ensino_planos_aula (Espaço do Professor / Grade-Aulas) ──
-- Só estende o WITH CHECK (escrita). O USING (leitura, pra localizar a linha
-- em UPDATE/DELETE) já é aberto a qualquer membro ativo do ministério — não
-- precisa mudar, professor/auxiliar/secretaria já são membros.

drop policy if exists "membro_all_ensino_planos" on public.ensino_planos_aula;
create policy "membro_all_ensino_planos" on public.ensino_planos_aula
as permissive for all
using (
  exists (
    select 1 from public.ensino_turmas t
    where t.id = ensino_planos_aula.turma_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and t.church_id = get_user_church_id())
        or check_ministerio_member(auth.uid(), t.ministerio_id)
      )
  )
)
with check (
  exists (
    select 1 from public.ensino_turmas t
    where t.id = ensino_planos_aula.turma_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and t.church_id = get_user_church_id())
        or can_ministry(auth.uid(), 'write'::text, t.ministerio_id)
        or (
          has_funcao_permissao(auth.uid(), t.ministerio_id, 'eb.professor.gerenciar_turma')
          and t.professor_id = get_profile_id(auth.uid())
        )
      )
  )
);

-- ── PARTE 4: RLS — ensino_plano_arquivos (materiais anexados ao plano) ─────
-- Mesmo escopo do professor (turma própria) — auxiliar/secretaria não mexem
-- em conteúdo de aula, então não entram aqui.

drop policy if exists "membro_all_ensino_arquivos" on public.ensino_plano_arquivos;
create policy "membro_all_ensino_arquivos" on public.ensino_plano_arquivos
as permissive for all
using (
  exists (
    select 1 from public.ensino_planos_aula p
    join public.ensino_turmas t on t.id = p.turma_id
    where p.id = ensino_plano_arquivos.plano_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and t.church_id = get_user_church_id())
        or check_ministerio_member(auth.uid(), t.ministerio_id)
      )
  )
)
with check (
  exists (
    select 1 from public.ensino_planos_aula p
    join public.ensino_turmas t on t.id = p.turma_id
    where p.id = ensino_plano_arquivos.plano_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and t.church_id = get_user_church_id())
        or can_ministry(auth.uid(), 'write'::text, t.ministerio_id)
        or (
          has_funcao_permissao(auth.uid(), t.ministerio_id, 'eb.professor.gerenciar_turma')
          and t.professor_id = get_profile_id(auth.uid())
        )
      )
  )
);

-- ── PARTE 5: RLS — ensino_checkins (Chamada, cabeçalho da sessão) ──────────
-- Professor só na própria turma; Auxiliar em qualquer turma do ministério.

drop policy if exists "membro_all_ensino_checkins" on public.ensino_checkins;
create policy "membro_all_ensino_checkins" on public.ensino_checkins
as permissive for all
using (
  check_ministerio_member(auth.uid(), ministerio_id)
  and ((church_id is null) or (church_id = get_user_church_id()))
)
with check (
  (
    can_ministry(auth.uid(), 'write'::text, ministerio_id)
    or has_funcao_permissao(auth.uid(), ministerio_id, 'eb.chamada.qualquer_turma')
    or (
      has_funcao_permissao(auth.uid(), ministerio_id, 'eb.professor.gerenciar_turma')
      and exists (
        select 1 from public.ensino_turmas t
        where t.id = ensino_checkins.turma_id and t.professor_id = get_profile_id(auth.uid())
      )
    )
  )
  and ((church_id is null) or (church_id = get_user_church_id()))
);

-- ── PARTE 6: RLS — ensino_presencas (linhas de presença dentro da chamada) ─

drop policy if exists "membro_all_ensino_presencas" on public.ensino_presencas;
create policy "membro_all_ensino_presencas" on public.ensino_presencas
as permissive for all
using (
  exists (
    select 1 from public.ensino_checkins ck
    where ck.id = ensino_presencas.checkin_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and ck.church_id = get_user_church_id())
        or check_ministerio_member(auth.uid(), ck.ministerio_id)
      )
  )
)
with check (
  exists (
    select 1 from public.ensino_checkins ck
    where ck.id = ensino_presencas.checkin_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and ck.church_id = get_user_church_id())
        or can_ministry(auth.uid(), 'write'::text, ck.ministerio_id)
        or has_funcao_permissao(auth.uid(), ck.ministerio_id, 'eb.chamada.qualquer_turma')
        or (
          has_funcao_permissao(auth.uid(), ck.ministerio_id, 'eb.professor.gerenciar_turma')
          and exists (
            select 1 from public.ensino_turmas t
            where t.id = ck.turma_id and t.professor_id = get_profile_id(auth.uid())
          )
        )
      )
  )
);

-- ── PARTE 7: RLS — eb_matriculas (Secretaria: matrículas da Escola Bíblica) ─
-- eb_matriculas não tem ministerio_id — resolve o ministério "Ensino" da
-- própria igreja da matrícula pelo slug fixo (mesmo padrão já usado em
-- LeaderMinisterioLayout pro fallback de admin, com o mesmo comentário sobre
-- slug não ser globalmente único: a comparação inclui church_id).
-- eb_presencas (relatório) já tinha SELECT liberado pra qualquer autenticado
-- da igreja desde o hardening da PR #56 — Secretaria já enxerga sem mudança.

create policy "eb_matriculas_secretaria_funcao" on public.eb_matriculas
as permissive for all
using (
  church_id = get_user_church_id()
  and exists (
    select 1 from public.ministerios m
    where m.church_id = eb_matriculas.church_id
      and m.slug = 'ensino'
      and has_funcao_permissao(auth.uid(), m.id, 'eb.secretaria.gerenciar')
  )
)
with check (
  church_id = get_user_church_id()
  and exists (
    select 1 from public.ministerios m
    where m.church_id = eb_matriculas.church_id
      and m.slug = 'ensino'
      and has_funcao_permissao(auth.uid(), m.id, 'eb.secretaria.gerenciar')
  )
);

-- ── PARTE 8: RLS — visitantes (Recepcionista: Visitantes do Dia) ───────────

create policy "visitantes_recepcao_funcao" on public.visitantes
as permissive for all
using (
  church_id = get_user_church_id()
  and exists (
    select 1 from public.ministerios m
    where m.church_id = visitantes.church_id
      and m.slug = 'recepcao'
      and has_funcao_permissao(auth.uid(), m.id, 'recepcao.visitantes.gerenciar')
  )
)
with check (
  church_id = get_user_church_id()
  and exists (
    select 1 from public.ministerios m
    where m.church_id = visitantes.church_id
      and m.slug = 'recepcao'
      and has_funcao_permissao(auth.uid(), m.id, 'recepcao.visitantes.gerenciar')
  )
);
