-- Catálogo de permissões — Kids, Música, Celebração, Mídia.

-- Professor(a) EB já existe (Kids) — ganha a permissão de sala.
update public.ministerio_funcoes f
set permissoes = array['mca.professor.gerenciar_sala']
from public.ministerios m
where f.ministerio_id = m.id and m.slug = 'mca' and f.nome = 'Professor(a)';

-- Responsável pelo Check-in já existe (Kids) — ganha checkin qualquer sala.
update public.ministerio_funcoes f
set permissoes = array['mca.checkin.qualquer_sala']
from public.ministerios m
where f.ministerio_id = m.id and m.slug = 'mca' and f.nome = 'Responsável pelo Check-in';

-- Auxiliar e Secretaria são novas (Kids) — criadas em todas as igrejas
-- existentes, mesmo padrão set-based da PR #60 pro Ensino.
insert into public.ministerio_funcoes (ministerio_id, nome, descricao, permissoes, church_id)
select m.id, 'Auxiliar', 'Faz check-in/check-out em qualquer sala do Kids, sem gerenciar plano de aula nem cadastro de crianças.',
       array['mca.checkin.qualquer_sala'], m.church_id
from public.ministerios m
where m.slug = 'mca'
  and not exists (select 1 from public.ministerio_funcoes f where f.ministerio_id = m.id and f.nome = 'Auxiliar');

insert into public.ministerio_funcoes (ministerio_id, nome, descricao, permissoes, church_id)
select m.id, 'Secretaria', 'Gerencia cadastro de crianças e responsáveis do Kids, sem estar preso a uma sala.',
       array['mca.secretaria.gerenciar'], m.church_id
from public.ministerios m
where m.slug = 'mca'
  and not exists (select 1 from public.ministerio_funcoes f where f.ministerio_id = m.id and f.nome = 'Secretaria');

-- Líder de Louvor (Música) — ganha a permissão de liturgia/repertório.
update public.ministerio_funcoes f
set permissoes = array['musica.liturgia.gerenciar']
from public.ministerios m
where f.ministerio_id = m.id and m.slug = 'musica' and f.nome = 'Líder de Louvor';

-- Responsável pelos Avisos (Celebração) — ganha a permissão de avisos do culto.
update public.ministerio_funcoes f
set permissoes = array['celebracao.avisos.gerenciar']
from public.ministerios m
where f.ministerio_id = m.id and m.slug = 'celebracao' and f.nome = 'Responsável pelos Avisos';

-- Fotógrafo(a), Cinegrafista, Projecionista (Mídia) — as três ganham a
-- mesma permissão de gerenciar documentos/mídia do ministério.
update public.ministerio_funcoes f
set permissoes = array['midia.documentos.gerenciar']
from public.ministerios m
where f.ministerio_id = m.id and m.slug = 'midia' and f.nome in ('Fotógrafo(a)', 'Cinegrafista', 'Projecionista');
