-- fn_seed_nova_igreja precisa nascer com o catálogo de Kids/Música/
-- Celebração/Mídia desta rodada — mesmo padrão da PR #60 pro Ensino. Único
-- trecho alterado: o INSERT em ministerio_funcoes ganhou permissoes
-- preenchido nas funções já existentes que ganharam permissão, e as duas
-- funções novas do Kids (Auxiliar, Secretaria). Resto da função idêntico.
create or replace function public.fn_seed_nova_igreja(p_church_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_ciclo1_id                uuid := gen_random_uuid();
  v_ciclo2_id                uuid := gen_random_uuid();
  v_ministerio_musica_id     uuid := gen_random_uuid();
  v_ministerio_celebracao_id uuid := gen_random_uuid();
  v_ministerio_kids_id       uuid := gen_random_uuid();
  v_ministerio_ensino_id     uuid := gen_random_uuid();
  v_ministerio_midia_id      uuid := gen_random_uuid();
  v_ministerio_recepcao_id   uuid := gen_random_uuid();
  v_ministerio_base_id       uuid := gen_random_uuid();
BEGIN

  -- ── MINISTÉRIOS PADRÃO ──
  INSERT INTO ministerios (id, nome, slug, tipo, descricao, ativo, is_core, church_id) VALUES
    (v_ministerio_musica_id,     'Música',     'musica',          'musica',          'Ministério de louvor e adoração',          true, true,  p_church_id),
    (v_ministerio_celebracao_id, 'Celebração', 'celebracao',      'celebracao',      'Ministério de celebração e pregação',      true, true,  p_church_id),
    (v_ministerio_kids_id,       'Kids',       'mca',             'mca',             'Ministério de crianças e adolescentes',    true, false, p_church_id),
    (v_ministerio_ensino_id,     'Ensino',     'ensino',          'ensino',          'Ministério de ensino e escola bíblica',    true, true,  p_church_id),
    (v_ministerio_midia_id,      'Mídia',      'midia',           'padrao',          'Ministério de comunicação e mídia',        true, false, p_church_id),
    (v_ministerio_recepcao_id,   'Recepção',   'recepcao',        'recepcao',        'Ministério de recepção e hospitalidade',   true, false, p_church_id),
    (v_ministerio_base_id,       'Base',       'base',            'pequenos-grupos', 'Pequenos grupos e células',                true, false, p_church_id)
  ON CONFLICT (church_id, slug) DO NOTHING;

  -- ── FUNÇÕES POR MINISTÉRIO ──
  INSERT INTO ministerio_funcoes (nome, ministerio_id, church_id, permissoes, descricao) VALUES
    ('Instrumentista',            v_ministerio_musica_id,     p_church_id, '{}', null),
    ('Vocal',                     v_ministerio_musica_id,     p_church_id, '{}', null),
    ('Líder de Louvor',           v_ministerio_musica_id,     p_church_id, array['musica.liturgia.gerenciar'], null),
    ('Pregador(a)',                v_ministerio_celebracao_id, p_church_id, '{}', null),
    ('Orador(a) de Abertura',     v_ministerio_celebracao_id, p_church_id, '{}', null),
    ('Responsável pelos Avisos',  v_ministerio_celebracao_id, p_church_id, array['celebracao.avisos.gerenciar'], null),
    ('Professor(a)',               v_ministerio_kids_id,       p_church_id, array['mca.professor.gerenciar_sala'], null),
    ('Responsável pelo Check-in', v_ministerio_kids_id,       p_church_id, array['mca.checkin.qualquer_sala'], null),
    ('Auxiliar',                   v_ministerio_kids_id,       p_church_id, array['mca.checkin.qualquer_sala'], 'Faz check-in/check-out em qualquer sala do Kids, sem gerenciar plano de aula nem cadastro de crianças.'),
    ('Secretaria',                 v_ministerio_kids_id,       p_church_id, array['mca.secretaria.gerenciar'], 'Gerencia cadastro de crianças e responsáveis do Kids, sem estar preso a uma sala.'),
    ('Fotógrafo(a)',               v_ministerio_midia_id,      p_church_id, array['midia.documentos.gerenciar'], null),
    ('Cinegrafista',               v_ministerio_midia_id,      p_church_id, array['midia.documentos.gerenciar'], null),
    ('Projecionista',              v_ministerio_midia_id,      p_church_id, array['midia.documentos.gerenciar'], null),
    ('Recepcionista',              v_ministerio_recepcao_id,   p_church_id, array['recepcao.visitantes.gerenciar'], null),
    ('Estacionamento',             v_ministerio_recepcao_id,   p_church_id, '{}', null),
    ('Professor(a) EB',            v_ministerio_ensino_id,     p_church_id, array['eb.professor.gerenciar_turma'], null),
    ('Auxiliar',                   v_ministerio_ensino_id,     p_church_id, array['eb.chamada.qualquer_turma'], 'Faz chamada em qualquer turma do Ensino, sem gerenciar conteúdo de aula nem matrícula.'),
    ('Secretaria',                 v_ministerio_ensino_id,     p_church_id, array['eb.secretaria.gerenciar'], 'Gerencia matrículas e visualiza relatórios de presença da Escola Bíblica, sem editar conteúdo de aula.'),
    ('Líder de Base',              v_ministerio_base_id,       p_church_id, '{}', null)
  ON CONFLICT DO NOTHING;

  -- ── CATEGORIAS FINANCEIRAS ──
  INSERT INTO categorias_financeiras (nome, natureza, church_id) VALUES
    ('Dízimo',            'receita', p_church_id),
    ('Oferta',            'receita', p_church_id),
    ('Oferta de Missões', 'receita', p_church_id),
    ('Campanha',          'receita', p_church_id),
    ('Doação',            'receita', p_church_id),
    ('Aluguel',           'despesa', p_church_id),
    ('Energia Elétrica',  'despesa', p_church_id),
    ('Água',              'despesa', p_church_id),
    ('Internet',          'despesa', p_church_id),
    ('Materiais',         'despesa', p_church_id),
    ('Eventos',           'despesa', p_church_id),
    ('Salários',          'despesa', p_church_id),
    ('Missões',           'despesa', p_church_id)
  ON CONFLICT DO NOTHING;

  -- ── CICLOS DA ESCOLA BÍBLICA ──
  INSERT INTO eb_ciclos (id, nome, subtitulo, ordem, church_id) VALUES
    (v_ciclo1_id, 'Ano 1', 'Fundamentos da fé, narrativa bíblica e vida cristã no mundo', 1, p_church_id),
    (v_ciclo2_id, 'Ano 2', 'Doutrina, ecclesiologia, escatologia e missão integral',       2, p_church_id)
  ON CONFLICT DO NOTHING;

  -- ── DISCIPLINAS ANO 1 ──
  INSERT INTO eb_disciplinas (id, ciclo_id, mes, eixo_tematico, titulo, subtitulo, ordem, church_id) VALUES
    (gen_random_uuid(), v_ciclo1_id,  2, 'Fundamentos Teológicos', 'A Bíblia como Palavra de Deus',                       'Inspiração, cânon, autoridade e interpretação',                                       1, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  3, 'História e Doutrina',    'Panorama do Antigo Testamento',                       'Da criação ao exílio — o fio condutor da redenção e a espera do Messias',            2, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  4, 'Cultura e Vida Cristã',  'Jesus Cristo: pessoa, obra e mediação',               'Encarnação, ministério, cruz, ressurreição e intercessão atual',                     3, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  5, 'Cosmovisão e Sociedade', 'Cosmovisão cristã frente ao pensamento moderno',      'Pós-modernidade, relativismo moral, identidade de gênero e bioética',                4, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  6, 'Fundamentos Teológicos', 'A Trindade: quem é Deus e o que isso muda na vida',   'Doutrina trinitária, implicações práticas e erros históricos a evitar',              5, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  8, 'História e Doutrina',    'Igreja primitiva ao protestantismo: fé que resistiu', 'Perseguições, concílios, Reforma — o que chegou até nós e por quê importa',         6, p_church_id),
    (gen_random_uuid(), v_ciclo1_id,  9, 'Cultura e Vida Cristã',  'Disciplinas espirituais: formação do caráter cristão','Oração, jejum, meditação bíblica, silêncio, comunidade',                            7, p_church_id),
    (gen_random_uuid(), v_ciclo1_id, 10, 'Cosmovisão e Sociedade', 'Fé pública: cristãos na política, mídia e cultura',   'Como a fé opera no espaço público — sem teocracia, sem omissão',                    8, p_church_id),
    (gen_random_uuid(), v_ciclo1_id, 11, 'Fechamento',             'Salvação: graça, fé, regeneração e segurança eterna', 'O ordo salutis completo — do chamado à glorificação',                               9, p_church_id)
  ON CONFLICT DO NOTHING;

  -- ── DISCIPLINAS ANO 2 ──
  INSERT INTO eb_disciplinas (id, ciclo_id, mes, eixo_tematico, titulo, subtitulo, ordem, church_id) VALUES
    (gen_random_uuid(), v_ciclo2_id,  2, 'Fundamentos Teológicos', 'Doutrinas essenciais da fé cristã',                              'Pecado original, expiação, graça, ressurreição — onde está o limite do essencial',    1, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  3, 'História e Doutrina',    'Identidade doutrinária: os fundamentos da IAP',                  '4 blocos: Deus/Escrituras — Cristo/Salvação — Igreja — Escatologia',                 2, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  4, 'Cultura e Vida Cristã',  'Panorama do Novo Testamento',                                    'Dos Evangelhos ao Apocalipse — cumprimento, missão e esperança',                     3, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  5, 'Cosmovisão e Sociedade', 'Ética cristã aplicada: pobreza, raça, justiça e meio ambiente',  'O cristão diante das desigualdades — entre o ativismo vazio e a omissão religiosa', 4, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  6, 'Fundamentos Teológicos', 'O Espírito Santo: pessoa, dons e vida na comunidade',            'Continuidade dos dons, discernimento, unidade e os excessos a evitar',              5, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  8, 'História e Doutrina',    'Ecclesiologia: o que é a Igreja, para que existe e o que ela não é','Marcas da Igreja verdadeira, governo eclesiástico, ordenanças',               6, p_church_id),
    (gen_random_uuid(), v_ciclo2_id,  9, 'Cultura e Vida Cristã',  'Escatologia e esperança: como o fim molda o presente',           'Segunda vinda, ressurreição, juízo — a esperança como combustível para agir agora', 7, p_church_id),
    (gen_random_uuid(), v_ciclo2_id, 10, 'Cosmovisão e Sociedade', 'Apologética prática: defendendo a fé com inteligência',          'Como responder ao ateísmo, sincretismo e indiferença',                              8, p_church_id),
    (gen_random_uuid(), v_ciclo2_id, 11, 'Fechamento',             'Missão integral: discipulado, evangelização e transformação',    'Grande Comissão + Grande Mandamento — separar os dois é erro teológico',            9, p_church_id)
  ON CONFLICT DO NOTHING;

  -- ── AULAS (4 por disciplina) ──
  INSERT INTO eb_aulas (disciplina_id, numero, titulo)
  SELECT d.id, n.num, 'Aula ' || n.num
  FROM eb_disciplinas d
  CROSS JOIN (VALUES (1),(2),(3),(4)) AS n(num)
  WHERE d.church_id = p_church_id
  ON CONFLICT (disciplina_id, numero) DO NOTHING;

  -- ── CONFIGURAÇÃO INICIAL DA INSTITUIÇÃO ──
  INSERT INTO configuracoes_instituicao (church_id, membros_editam_perfil, notificacoes_push, notificacoes_email, notificacoes_lideres)
  VALUES (p_church_id, true, false, false, true)
  ON CONFLICT (church_id) DO NOTHING;

END;
$function$;
