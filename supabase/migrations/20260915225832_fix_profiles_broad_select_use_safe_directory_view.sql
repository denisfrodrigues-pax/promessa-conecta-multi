-- profiles_church_members_select (commit anterior desta mesma branch) liberava SELECT
-- da linha INTEIRA de profiles pra qualquer autenticado da mesma igreja — expondo cpf,
-- endereco, observacoes_privadas e outros campos sensíveis a voluntário/membro comum,
-- não só nome/foto/data_nascimento. RLS é por linha, não por coluna, então não dá pra
-- "restringir colunas" nessa mesma policy — a correção é remover o SELECT amplo da
-- tabela base e expor só os campos não-sensíveis via uma view separada, com uma
-- lista explícita de colunas.
drop policy if exists "profiles_church_members_select" on public.profiles;

-- View sem security_invoker (proposital — roda com o dono da view, então bypassa a
-- RLS de profiles internamente; a restrição por igreja é feita explicitamente no WHERE
-- abaixo, não delegada à RLS da tabela base). Contém só as colunas não-sensíveis já
-- usadas hoje por telas que precisam mostrar outro membro da mesma igreja: nome/foto
-- (card de aniversariantes, nome do líder de uma base pública, colegas de ministério),
-- data_nascimento (card de aniversariantes) e telefone (botão de WhatsApp do card de
-- aniversariantes, já era o comportamento pretendido da feature). NÃO inclui: cpf,
-- endereco, logradouro, numero, complemento, bairro, cidade, uf, cep,
-- observacoes_privadas, estado_civil, profissao, formacao, grau_instrucao, pcd,
-- naturalidade, sexo, email.
create view public.profiles_church_directory
  with (security_invoker = false)
as
select id, user_id, nome, foto_url, data_nascimento, telefone
from public.profiles
where church_id = get_user_church_id();

comment on view public.profiles_church_directory is
  'Subconjunto seguro (sem colunas sensíveis) de profiles, escopado por igreja no próprio WHERE — não depende da RLS de profiles. NÃO adicionar security_invoker=true nem novas colunas sem avaliar sensibilidade.';

grant select on public.profiles_church_directory to authenticated;
