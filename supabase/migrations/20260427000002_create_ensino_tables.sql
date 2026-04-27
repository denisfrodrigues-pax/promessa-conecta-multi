-- Etapa Ensino: turmas, planos de aula, chamadas e presenças

-- ─── TABELA ensino_turmas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_turmas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome          text        NOT NULL,
  descricao     text,
  professor_id  uuid,
  ativo         boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_planos_aula ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_planos_aula (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id     uuid        NOT NULL REFERENCES ensino_turmas(id) ON DELETE CASCADE,
  professor_id uuid,
  titulo       text        NOT NULL,
  data_aula    date        NOT NULL,
  objetivos    text,
  conteudo     text,
  anotacoes    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_plano_arquivos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_plano_arquivos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id       uuid        NOT NULL REFERENCES ensino_planos_aula(id) ON DELETE CASCADE,
  nome           text        NOT NULL,
  arquivo_url    text        NOT NULL,
  arquivo_tipo   text        NOT NULL,
  tamanho_bytes  integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA ensino_checkins ───────────────────────────────────────────────────
-- Representa uma sessão de chamada (turma + data)
CREATE TABLE IF NOT EXISTS ensino_checkins (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id       uuid        NOT NULL REFERENCES ensino_turmas(id) ON DELETE CASCADE,
  church_id      uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id  uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  data           date        NOT NULL,
  titulo         text,
  observacoes    text,
  registrado_por uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turma_id, data)
);

-- ─── TABELA ensino_presencas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ensino_presencas (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id   uuid        NOT NULL REFERENCES ensino_checkins(id) ON DELETE CASCADE,
  perfil_id    uuid,
  nome_manual  text,
  is_visitante boolean     NOT NULL DEFAULT false,
  presente     boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nome_ou_perfil CHECK (perfil_id IS NOT NULL OR nome_manual IS NOT NULL)
);

-- ─── TRIGGERS updated_at ──────────────────────────────────────────────────────
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ensino_turmas','ensino_planos_aula']
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

-- ─── STORAGE BUCKET ensino-planos ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('ensino-planos', 'ensino-planos', false)
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_select" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'ensino-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ensino-planos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'ensino_planos_auth_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "ensino_planos_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'ensino-planos');
  END IF;
END $$;

-- ─── RLS ensino_turmas ────────────────────────────────────────────────────────
ALTER TABLE ensino_turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "lider_all_ensino_turmas" ON ensino_turmas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_ensino_turmas" ON ensino_turmas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = ensino_turmas.ministerio_id AND ativo = true
  ));

-- ─── RLS ensino_planos_aula ───────────────────────────────────────────────────
ALTER TABLE ensino_planos_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_planos" ON ensino_planos_aula FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_turmas t
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE t.id = ensino_planos_aula.turma_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_turmas t
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE t.id = ensino_planos_aula.turma_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_plano_arquivos ────────────────────────────────────────────────
ALTER TABLE ensino_plano_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_arquivos" ON ensino_plano_arquivos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE p.id = ensino_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_planos_aula p
    JOIN ensino_turmas t ON t.id = p.turma_id
    JOIN ministerio_usuarios mu ON mu.ministerio_id = t.ministerio_id
    WHERE p.id = ensino_plano_arquivos.plano_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_checkins ──────────────────────────────────────────────────────
ALTER TABLE ensino_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_checkins" ON ensino_checkins FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.user_id = auth.uid() AND mu.ministerio_id = ensino_checkins.ministerio_id AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.user_id = auth.uid() AND mu.ministerio_id = ensino_checkins.ministerio_id AND mu.ativo = true
    LIMIT 1
  ));

-- ─── RLS ensino_presencas ─────────────────────────────────────────────────────
ALTER TABLE ensino_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));

CREATE POLICY "membro_all_ensino_presencas" ON ensino_presencas FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    JOIN ministerio_usuarios mu ON mu.ministerio_id = ck.ministerio_id
    WHERE ck.id = ensino_presencas.checkin_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ensino_checkins ck
    JOIN ministerio_usuarios mu ON mu.ministerio_id = ck.ministerio_id
    WHERE ck.id = ensino_presencas.checkin_id AND mu.user_id = auth.uid() AND mu.ativo = true
    LIMIT 1
  ));
