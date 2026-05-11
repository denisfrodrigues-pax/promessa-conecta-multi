-- =============================================================
-- seed_membros.sql — Importação de 20 membros
-- Igreja da Promessa Hortolândia
-- =============================================================
-- INSTRUÇÕES ANTES DE EXECUTAR:
--   1. Abra este arquivo em um editor de texto
--   2. Faça Find & Replace: substitua SENHA_PLACEHOLDER pela senha
--      inicial que todos os membros usarão para o primeiro acesso
--   3. Execute no SQL Editor do Supabase (Project > SQL Editor)
-- =============================================================
-- Arquitetura:
--   auth.users.id     → UUID_AUTH
--   profiles.id       → UUID_PROFILE (gerado separado)
--   profiles.user_id  → UUID_AUTH
--   user_roles.user_id → UUID_AUTH
--   membros.user_id   → UUID_PROFILE
-- =============================================================

-- ---------------------------------------------------------------
-- 4. DENIS FERREIRA RODRIGUES — PASTOR LOCAL
-- Conta existente — atualiza perfil e cria registro em membros
-- auth_id: 8673ef5c-cd41-433b-8401-a1480e29c5a1
-- profile_id: 6847ff1d-aa73-438f-bdca-b53a4d65b8ca
-- ---------------------------------------------------------------
UPDATE profiles SET
  nome               = 'Denis Ferreira Rodrigues',
  telefone           = '(19) 99994-7697',
  data_nascimento    = '1992-05-31',
  sexo               = 'M',
  estado_civil       = 'casado',
  cpf                = '39920506885',
  logradouro         = 'Alameda das Cabreúvas',
  numero             = '501',
  bairro             = 'Parque Manoel de Vasconcelos',
  cidade             = 'Sumaré',
  uf                 = 'SP',
  cep                = '13174550',
  grau_instrucao     = 'Superior Completo',
  batizado_aguas     = TRUE,
  data_batismo       = '2005-12-13',
  updated_at         = now()
WHERE id = '6847ff1d-aa73-438f-bdca-b53a4d65b8ca';

INSERT INTO user_roles (id, user_id, role)
VALUES (gen_random_uuid(), '8673ef5c-cd41-433b-8401-a1480e29c5a1', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO membros (id, user_id, nome, email, telefone, data_nascimento, genero, estado_civil, cpf,
  rua, numero, bairro, cidade, estado, cep, grau_instrucao,
  data_batismo_agua, ordenacao_funcao, situacao_ministerial, status, created_at, updated_at)
VALUES (
  gen_random_uuid(), '6847ff1d-aa73-438f-bdca-b53a4d65b8ca',
  'Denis Ferreira Rodrigues', 'denisf.rodrigues@hotmail.com', '(19) 99994-7697',
  '1992-05-31', 'M', 'casado', '39920506885',
  'Alameda das Cabreúvas', '501', 'Parque Manoel de Vasconcelos', 'Sumaré', 'SP', '13174550',
  'Superior Completo', '2005-12-13', 'Pastor Tempo Integral', 'ativo', 'ativo', now(), now()
)
ON CONFLICT (user_id) DO UPDATE SET
  nome               = EXCLUDED.nome,
  telefone           = EXCLUDED.telefone,
  data_nascimento    = EXCLUDED.data_nascimento,
  genero             = EXCLUDED.genero,
  estado_civil       = EXCLUDED.estado_civil,
  cpf                = EXCLUDED.cpf,
  rua                = EXCLUDED.rua,
  numero             = EXCLUDED.numero,
  bairro             = EXCLUDED.bairro,
  cidade             = EXCLUDED.cidade,
  estado             = EXCLUDED.estado,
  cep                = EXCLUDED.cep,
  grau_instrucao     = EXCLUDED.grau_instrucao,
  data_batismo_agua  = EXCLUDED.data_batismo_agua,
  ordenacao_funcao   = EXCLUDED.ordenacao_funcao,
  situacao_ministerial = EXCLUDED.situacao_ministerial,
  updated_at         = now();


-- =============================================================
-- Membros novos (1–3, 5–20) — inserção via DO block
-- =============================================================
DO $$
DECLARE
  v_senha  TEXT := crypt('SENHA_PLACEHOLDER', gen_salt('bf'));
  v_auth   UUID;
  v_prof   UUID;
BEGIN

-- ---------------------------------------------------------------
-- 1. ALINE GONÇALVES GOMES — FINANCEIRO LOCAL
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'aline_ggomes@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'aline_ggomes@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Aline Gonçalves Gomes"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,telefone,data_nascimento,sexo,estado_civil,cpf,
  logradouro,numero,bairro,cidade,uf,cep,grau_instrucao,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Aline Gonçalves Gomes','aline_ggomes@hotmail.com','(19) 98248-3771',
  '1985-10-23','F','solteiro','32607354889',
  'Rua Maria Benedita Lustoza','38','Parque Bandeirantes I Nova Veneza','Sumaré','SP','13181741',
  'Superior Completo','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'financeiro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,telefone,data_nascimento,genero,estado_civil,cpf,
  rua,numero,bairro,cidade,estado,cep,grau_instrucao,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Aline Gonçalves Gomes','aline_ggomes@hotmail.com','(19) 98248-3771',
  '1985-10-23','F','solteiro','32607354889',
  'Rua Maria Benedita Lustoza','38','Parque Bandeirantes I Nova Veneza','Sumaré','SP','13181741',
  'Superior Completo','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 2. ARTHUR SIQUEIRA FERREIRA RODRIGUES — MEMBRO (frequentador)
-- E-mail gerado por CPF (sem e-mail real)
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = '53620295840@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    '53620295840@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Arthur Siqueira Ferreira Rodrigues"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,telefone,data_nascimento,sexo,estado_civil,cpf,
  logradouro,numero,bairro,cidade,uf,cep,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Arthur Siqueira Ferreira Rodrigues','53620295840@promessa.app','(19) 99994-7697',
  '2017-10-10','M','solteiro','53620295840',
  'Rua Eugenio Dorigan','44','Jardim Silmara','Sumaré','SP','13905304',
  'ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,telefone,data_nascimento,genero,estado_civil,cpf,
  rua,numero,bairro,cidade,estado,cep,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Arthur Siqueira Ferreira Rodrigues','53620295840@promessa.app','(19) 99994-7697',
  '2017-10-10','M','solteiro','53620295840',
  'Rua Eugenio Dorigan','44','Jardim Silmara','Sumaré','SP','13905304',
  'frequentador',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 3. BIANCA VALÉRIA BRIGUENTI DA SILVA — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'bia_valeria@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'bia_valeria@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Bianca Valéria Briguenti da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,telefone,data_nascimento,sexo,estado_civil,cpf,
  logradouro,numero,complemento,bairro,cidade,uf,cep,grau_instrucao,
  batizado_aguas,data_batismo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Bianca Valéria Briguenti da Silva','bia_valeria@hotmail.com','(19) 98398-9022',
  '1987-07-14','F','casado','35052289820',
  'Avenida Augusta Diogo Ayala','21','Bloco M 33','Jardim Bom Retiro Nova Veneza','Sumaré','SP','13181610',
  'Superior Completo',TRUE,'2002-09-14','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,telefone,data_nascimento,genero,estado_civil,cpf,
  rua,numero,complemento,bairro,cidade,estado,cep,grau_instrucao,
  data_batismo_agua,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Bianca Valéria Briguenti da Silva','bia_valeria@hotmail.com','(19) 98398-9022',
  '1987-07-14','F','casado','35052289820',
  'Avenida Augusta Diogo Ayala','21','Bloco M 33','Jardim Bom Retiro Nova Veneza','Sumaré','SP','13181610',
  'Superior Completo','2002-09-14','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 5. EDUARDO HENRIQUE ALVES DOS SANTOS — MEMBRO
-- E-mail gerado por CPF (sem e-mail real)
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = '55396243264@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    '55396243264@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Eduardo Henrique Alves dos Santos"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,data_nascimento,sexo,estado_civil,cpf,
  logradouro,numero,bairro,cidade,uf,cep,grau_instrucao,
  batizado_aguas,data_batismo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Eduardo Henrique Alves dos Santos','55396243264@promessa.app',
  '2004-04-16','M','solteiro','55396243264',
  'R Luiz Otavio Sartori B. P. Melo','171','Vida Nova','Campinas','SP','13054557',
  'Ensino Médio Incompleto',TRUE,'2018-09-15','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,data_nascimento,genero,estado_civil,cpf,
  rua,numero,bairro,cidade,estado,cep,grau_instrucao,
  data_batismo_agua,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Eduardo Henrique Alves dos Santos','55396243264@promessa.app',
  '2004-04-16','M','solteiro','55396243264',
  'R Luiz Otavio Sartori B. P. Melo','171','Vida Nova','Campinas','SP','13054557',
  'Ensino Médio Incompleto','2018-09-15','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 6. ELIANA CRISTINA DA SILVA SANTOS — SECRETARIA LOCAL (admin)
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'eliana.secretaria@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'eliana.secretaria@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Eliana Cristina da Silva Santos"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Eliana Cristina da Silva Santos','eliana.secretaria@promessa.app',
  'F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'admin'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Eliana Cristina da Silva Santos','eliana.secretaria@promessa.app',
  'F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 7. EMILLY JÚLIA — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'emillyjulia330@gmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'emillyjulia330@gmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Emilly Júlia"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Emilly Júlia','emillyjulia330@gmail.com','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Emilly Júlia','emillyjulia330@gmail.com','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 8. FELIPE CARLOS MENDES — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'felipecarlosmendes07@gmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'felipecarlosmendes07@gmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Felipe Carlos Mendes"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Felipe Carlos Mendes','felipecarlosmendes07@gmail.com','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Felipe Carlos Mendes','felipecarlosmendes07@gmail.com','M','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 9. FRANCINETE SIQUEIRA RODRIGUES — DIRETORIA REGIONAL (admin)
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'francy.nete@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'francy.nete@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Francinete Siqueira Rodrigues"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Francinete Siqueira Rodrigues','francy.nete@hotmail.com','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'admin'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Francinete Siqueira Rodrigues','francy.nete@hotmail.com','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 10. HEITOR SIQUEIRA FERREIRA RODRIGUES — MEMBRO (frequentador)
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'heitor.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'heitor.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Heitor Siqueira Ferreira Rodrigues"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Heitor Siqueira Ferreira Rodrigues','heitor.membro@promessa.app','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Heitor Siqueira Ferreira Rodrigues','heitor.membro@promessa.app','M','frequentador',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 11. HELOISA DA SILVA — MEMBRO
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'heloisa.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'heloisa.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Heloisa da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Heloisa da Silva','heloisa.membro@promessa.app','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Heloisa da Silva','heloisa.membro@promessa.app','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 12. LÍVIA VITÓRIA BRIGUENTI DA SILVA — MEMBRO (frequentador)
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'livia.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'livia.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Lívia Vitória Briguenti da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Lívia Vitória Briguenti da Silva','livia.membro@promessa.app','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Lívia Vitória Briguenti da Silva','livia.membro@promessa.app','F','frequentador',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 13. LUCAS ASAPH BRIGUENTI DA SILVA — MEMBRO (frequentador)
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'lucas.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'lucas.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Lucas Asaph Briguenti da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Lucas Asaph Briguenti da Silva','lucas.membro@promessa.app','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Lucas Asaph Briguenti da Silva','lucas.membro@promessa.app','M','frequentador',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 14. MARLI CASSIANO DE MORAES — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'marsearom@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'marsearom@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Marli Cassiano de Moraes"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Marli Cassiano de Moraes','marsearom@hotmail.com','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Marli Cassiano de Moraes','marsearom@hotmail.com','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 15. PRISCILA DA SILVA MORAES — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'yoss_eventos@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'yoss_eventos@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Priscila da Silva Moraes"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Priscila da Silva Moraes','yoss_eventos@hotmail.com','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Priscila da Silva Moraes','yoss_eventos@hotmail.com','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 16. SARA CRISTINA DE AGUIAR PEREIRA — SECRETARIA LOCAL (admin)
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'aguiar.sara2021@gmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'aguiar.sara2021@gmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Sara Cristina de Aguiar Pereira"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Sara Cristina de Aguiar Pereira','aguiar.sara2021@gmail.com','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'admin'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Sara Cristina de Aguiar Pereira','aguiar.sara2021@gmail.com','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 17. THAINA AGUIAR DA SILVA — MEMBRO
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'thaina.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'thaina.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Thaina Aguiar da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Thaina Aguiar da Silva','thaina.membro@promessa.app','F','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Thaina Aguiar da Silva','thaina.membro@promessa.app','F','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 18. THEO VICTOR GOMES FATURETO — MEMBRO (frequentador)
-- E-mail original duplicado com Aline Gomes — e-mail provisório
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'theo.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'theo.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Theo Victor Gomes Fatureto"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Theo Victor Gomes Fatureto','theo.membro@promessa.app','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Theo Victor Gomes Fatureto','theo.membro@promessa.app','M','frequentador',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 19. VALDOMIRO ALVES DOS SANTOS — MEMBRO
-- ATENÇÃO: sem CPF e sem e-mail real — e-mail provisório atribuído
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'valdomiro.membro@promessa.app';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'valdomiro.membro@promessa.app',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Valdomiro Alves dos Santos"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Valdomiro Alves dos Santos','valdomiro.membro@promessa.app','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Valdomiro Alves dos Santos','valdomiro.membro@promessa.app','M','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


-- ---------------------------------------------------------------
-- 20. WILLIAN FERNANDO DA SILVA — MEMBRO
-- ---------------------------------------------------------------
SELECT id INTO v_auth FROM auth.users WHERE email = 'willianauta@hotmail.com';
IF v_auth IS NULL THEN
  v_auth := gen_random_uuid();
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
  VALUES (v_auth,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
    'willianauta@hotmail.com',v_senha,now(),now(),now(),
    '{"provider":"email","providers":["email"]}','{"nome":"Willian Fernando da Silva"}');
END IF;
SELECT id INTO v_prof FROM profiles WHERE user_id = v_auth;
IF v_prof IS NULL THEN v_prof := gen_random_uuid(); END IF;
INSERT INTO profiles (id,user_id,nome,email,sexo,status,created_at,updated_at)
VALUES (v_prof,v_auth,'Willian Fernando da Silva','willianauta@hotmail.com','M','ativo'::user_status,now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();
INSERT INTO user_roles (id,user_id,role) VALUES (gen_random_uuid(),v_auth,'membro'::app_role)
ON CONFLICT (user_id,role) DO NOTHING;
INSERT INTO membros (id,user_id,nome,email,genero,situacao_ministerial,status,created_at,updated_at)
VALUES (gen_random_uuid(),v_prof,'Willian Fernando da Silva','willianauta@hotmail.com','M','ativo','ativo',now(),now())
ON CONFLICT (user_id) DO UPDATE SET nome=EXCLUDED.nome, updated_at=now();


END $$;
