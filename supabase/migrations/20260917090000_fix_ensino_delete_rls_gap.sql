-- Furo de segurança no PR #60 (permissões por função): nas 4 tabelas do
-- sistema ensino_* (ensino_planos_aula, ensino_plano_arquivos,
-- ensino_checkins, ensino_presencas), a policy "membro_all_*" (FOR ALL) tinha
-- USING amplo (qualquer membro ativo do ministério) e WITH CHECK restrito
-- (função certa + turma própria, quando aplicável).
--
-- No Postgres, DELETE só é controlado pela USING — WITH CHECK nunca entra em
-- jogo pra DELETE (não existe "linha nova" pra validar). Resultado: qualquer
-- membro ativo do Ensino — inclusive Auxiliar ou alguém sem função nenhuma —
-- conseguia apagar plano de aula, anexo, chamada ou presença de QUALQUER
-- turma, não só editar a própria. INSERT/UPDATE já estavam certos (WITH
-- CHECK valia pros dois); só DELETE escapou.
--
-- Correção: separar cada "membro_all_*" em duas policies —
--   1. Uma nova FOR SELECT, com a mesma condição ampla de sempre (leitura
--      continua liberada pra qualquer membro do ministério, intencional).
--   2. A FOR ALL existente passa a usar, na USING, a MESMA condição restrita
--      que já estava na WITH CHECK — USING e WITH CHECK ficam idênticos,
--      os dois restritos. SELECT continua permitido só pela nova policy
--      (1), então isso não afeta leitura; afeta INSERT (já era restrito,
--      sem mudança de comportamento), UPDATE (idem) e — o que importa aqui —
--      DELETE, que passa a exigir a mesma condição restrita.

-- ── ensino_planos_aula ──────────────────────────────────────────────────────

create policy "membro_select_ensino_planos" on public.ensino_planos_aula
as permissive for select
using (
  exists (
    select 1 from public.ensino_turmas t
    where t.id = ensino_planos_aula.turma_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and t.church_id = get_user_church_id())
        or check_ministerio_member(auth.uid(), t.ministerio_id)
      )
  )
);

drop policy if exists "membro_all_ensino_planos" on public.ensino_planos_aula;
create policy "membro_all_ensino_planos" on public.ensino_planos_aula
as permissive for all
using (
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

-- ── ensino_plano_arquivos ───────────────────────────────────────────────────

create policy "membro_select_ensino_arquivos" on public.ensino_plano_arquivos
as permissive for select
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
);

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
        or can_ministry(auth.uid(), 'write'::text, t.ministerio_id)
        or (
          has_funcao_permissao(auth.uid(), t.ministerio_id, 'eb.professor.gerenciar_turma')
          and t.professor_id = get_profile_id(auth.uid())
        )
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

-- ── ensino_checkins ──────────────────────────────────────────────────────────

create policy "membro_select_ensino_checkins" on public.ensino_checkins
as permissive for select
using (
  check_ministerio_member(auth.uid(), ministerio_id)
  and ((church_id is null) or (church_id = get_user_church_id()))
);

drop policy if exists "membro_all_ensino_checkins" on public.ensino_checkins;
create policy "membro_all_ensino_checkins" on public.ensino_checkins
as permissive for all
using (
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

-- ── ensino_presencas ─────────────────────────────────────────────────────────

create policy "membro_select_ensino_presencas" on public.ensino_presencas
as permissive for select
using (
  exists (
    select 1 from public.ensino_checkins ck
    where ck.id = ensino_presencas.checkin_id
      and (
        (has_role(auth.uid(), 'admin'::app_role) and ck.church_id = get_user_church_id())
        or check_ministerio_member(auth.uid(), ck.ministerio_id)
      )
  )
);

drop policy if exists "membro_all_ensino_presencas" on public.ensino_presencas;
create policy "membro_all_ensino_presencas" on public.ensino_presencas
as permissive for all
using (
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
