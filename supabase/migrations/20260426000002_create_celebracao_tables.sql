-- Etapa Celebração: liturgia do culto, itens e avisos

-- ─── TABELA liturgia_culto ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liturgia_culto (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  observacoes_gerais text,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── TABELA liturgia_itens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liturgia_itens (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  liturgia_id       uuid        NOT NULL REFERENCES liturgia_culto(id) ON DELETE CASCADE,
  ordem             integer     NOT NULL DEFAULT 0,
  tipo              text        NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('abertura','louvor','oracao','palavra','aviso','oferta','encerramento','outro')),
  titulo            text        NOT NULL,
  responsavel       text,
  duracao_minutos   integer,
  observacao        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA avisos_culto ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avisos_culto (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id     uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  aviso_id      uuid        NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  ordem         integer     NOT NULL DEFAULT 0,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, aviso_id, ministerio_id)
);

-- ─── TRIGGER updated_at ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_liturgia_culto_updated_at') THEN
    CREATE TRIGGER trg_liturgia_culto_updated_at
      BEFORE UPDATE ON liturgia_culto
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── RLS liturgia_culto ───────────────────────────────────────────────────────
ALTER TABLE liturgia_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_liturgia_culto"
  ON liturgia_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_liturgia_culto"
  ON liturgia_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_liturgia_culto"
  ON liturgia_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = liturgia_culto.ministerio_id AND ativo = true
  ));

-- ─── RLS liturgia_itens ───────────────────────────────────────────────────────
ALTER TABLE liturgia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_liturgia_itens"
  ON liturgia_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_liturgia_itens"
  ON liturgia_itens FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.papel = 'lider'
      AND mu.ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.papel = 'lider'
      AND mu.ativo = true
  ));

CREATE POLICY "membro_select_liturgia_itens"
  ON liturgia_itens FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM liturgia_culto lc
    JOIN ministerio_usuarios mu ON mu.ministerio_id = lc.ministerio_id
    WHERE lc.id = liturgia_itens.liturgia_id
      AND mu.user_id = auth.uid()
      AND mu.ativo = true
  ));

-- ─── RLS avisos_culto ─────────────────────────────────────────────────────────
ALTER TABLE avisos_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_avisos_culto"
  ON avisos_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_avisos_culto"
  ON avisos_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_avisos_culto"
  ON avisos_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = avisos_culto.ministerio_id AND ativo = true
  ));
