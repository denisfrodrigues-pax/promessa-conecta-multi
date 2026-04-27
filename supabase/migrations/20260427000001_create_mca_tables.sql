-- Etapa MCA: salas, crianças, responsáveis, check-ins, planos de aula, comunicações

-- ─── TABELA mca_salas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_salas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id    uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome             text        NOT NULL,
  faixa_etaria_min integer,
  faixa_etaria_max integer,
  capacidade       integer,
  professor_id     uuid,
  ativo            boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_criancas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_criancas (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome             text        NOT NULL,
  data_nascimento  date,
  foto_url         text,
  sala_id          uuid        REFERENCES mca_salas(id) ON DELETE SET NULL,
  observacoes      text,
  ativo            boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_responsaveis ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_responsaveis (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id  uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  perfil_id   uuid,
  nome        text        NOT NULL,
  telefone    text        NOT NULL,
  parentesco  text        NOT NULL DEFAULT 'responsável',
  is_primary  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_checkins ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_checkins (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id      uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  evento_id       uuid        REFERENCES eventos_escala(id) ON DELETE SET NULL,
  sala_id         uuid        NOT NULL REFERENCES mca_salas(id) ON DELETE CASCADE,
  church_id       uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  checkin_at      timestamptz NOT NULL DEFAULT now(),
  checkout_at     timestamptz,
  registrado_por  uuid,
  observacao      text
);

-- ─── TABELA mca_planos_aula ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_planos_aula (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id      uuid        NOT NULL REFERENCES mca_salas(id) ON DELETE CASCADE,
  professor_id uuid,
  titulo       text        NOT NULL,
  data_aula    date        NOT NULL,
  objetivos    text,
  conteudo     text,
  anotacoes    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_plano_arquivos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_plano_arquivos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id       uuid        NOT NULL REFERENCES mca_planos_aula(id) ON DELETE CASCADE,
  nome           text        NOT NULL,
  arquivo_url    text        NOT NULL,
  arquivo_tipo   text        NOT NULL,
  tamanho_bytes  integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA mca_comunicacoes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mca_comunicacoes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crianca_id           uuid        NOT NULL REFERENCES mca_criancas(id) ON DELETE CASCADE,
  responsavel_telefone text        NOT NULL,
  mensagem_original    text        NOT NULL,
  mensagem_melhorada   text,
  enviado              boolean     NOT NULL DEFAULT false,
  enviado_at           timestamptz,
  criado_por           uuid,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── TRIGGERS updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['mca_salas','mca_criancas','mca_planos_aula']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('mca-planos', 'mca-planos', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('mca-fotos', 'mca-fotos', true)
  ON CONFLICT (id) DO NOTHING;

-- Policies para mca-planos (autenticado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_select" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'mca-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mca-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_planos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_planos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'mca-planos');
  END IF;
  -- mca-fotos (público)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_public_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_public_select" ON storage.objects
      FOR SELECT USING (bucket_id = 'mca-fotos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mca-fotos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'mca_fotos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "mca_fotos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'mca-fotos');
  END IF;
END $$;

-- ─── RLS mca_salas ────────────────────────────────────────────────────────────
ALTER TABLE mca_salas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_salas" ON mca_salas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "lider_all_mca_salas" ON mca_salas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_mca_salas" ON mca_salas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = mca_salas.ministerio_id AND ativo = true
  ));

-- ─── RLS mca_criancas ─────────────────────────────────────────────────────────
ALTER TABLE mca_criancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_criancas" ON mca_criancas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_criancas" ON mca_criancas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id
    WHERE mu.user_id = auth.uid() AND mu.ativo = true AND s.church_id = mca_criancas.church_id
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id
    WHERE mu.user_id = auth.uid() AND mu.ativo = true AND s.church_id = mca_criancas.church_id
    LIMIT 1
  ));

-- ─── RLS mca_responsaveis ─────────────────────────────────────────────────────
ALTER TABLE mca_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_responsaveis" ON mca_responsaveis FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_responsaveis" ON mca_responsaveis FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_responsaveis.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_responsaveis.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ));

-- ─── RLS mca_checkins ─────────────────────────────────────────────────────────
ALTER TABLE mca_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_checkins" ON mca_checkins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_checkins" ON mca_checkins FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_checkins.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_checkins.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_planos_aula ──────────────────────────────────────────────────────
ALTER TABLE mca_planos_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_planos_aula" ON mca_planos_aula FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_planos_aula" ON mca_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_planos_aula.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_salas s
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE s.id = mca_planos_aula.sala_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_plano_arquivos ───────────────────────────────────────────────────
ALTER TABLE mca_plano_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_plano_arquivos" ON mca_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_plano_arquivos" ON mca_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_planos_aula p
    JOIN mca_salas s ON s.id = p.sala_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE p.id = mca_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_planos_aula p
    JOIN mca_salas s ON s.id = p.sala_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = s.ministerio_id
    WHERE p.id = mca_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS mca_comunicacoes ─────────────────────────────────────────────────────
ALTER TABLE mca_comunicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mca_comunicacoes" ON mca_comunicacoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_mca_comunicacoes" ON mca_comunicacoes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_comunicacoes.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM mca_criancas c
    JOIN ministerio_usuarios mu ON mu.ativo = true
    JOIN mca_salas s ON s.ministerio_id = mu.ministerio_id AND s.church_id = c.church_id
    WHERE c.id = mca_comunicacoes.crianca_id AND mu.user_id = auth.uid()
    LIMIT 1
  ));
