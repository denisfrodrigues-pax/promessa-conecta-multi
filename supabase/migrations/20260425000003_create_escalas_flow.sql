-- Etapa 3: Novo fluxo de escalas — periodos → eventos → convocação → escala por líder

-- ─── TABELA periodos_escala ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS periodos_escala (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  nome        text        NOT NULL,
  mes         integer     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano         integer     NOT NULL CHECK (ano BETWEEN 2020 AND 2100),
  status      text        NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  criado_por  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA eventos_escala ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_escala (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id      uuid        NOT NULL REFERENCES periodos_escala(id) ON DELETE CASCADE,
  church_id       uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  titulo          text        NOT NULL,
  tipo            text        NOT NULL DEFAULT 'culto',
  data_evento     date        NOT NULL,
  horario_inicio  time,
  horario_fim     time,
  descricao       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA evento_ministerios ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evento_ministerios (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id            uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id        uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  status               text        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'escala_criada', 'concluido')),
  notificacao_enviada  boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── ALTER escalas ────────────────────────────────────────────────────────────
ALTER TABLE escalas
  ADD COLUMN IF NOT EXISTS evento_escala_id uuid REFERENCES eventos_escala(id) ON DELETE SET NULL;

-- ─── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_periodos_escala_updated_at'
  ) THEN
    CREATE TRIGGER trg_periodos_escala_updated_at
      BEFORE UPDATE ON periodos_escala
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_eventos_escala_updated_at'
  ) THEN
    CREATE TRIGGER trg_eventos_escala_updated_at
      BEFORE UPDATE ON eventos_escala
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── RLS periodos_escala ──────────────────────────────────────────────────────
ALTER TABLE periodos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_periodos_escala"
  ON periodos_escala FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_periodos_escala"
  ON periodos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND papel = 'lider'
        AND ativo = true
    )
  );

-- ─── RLS eventos_escala ───────────────────────────────────────────────────────
ALTER TABLE eventos_escala ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_eventos_escala"
  ON eventos_escala FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_eventos_escala"
  ON eventos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "membro_select_eventos_escala"
  ON eventos_escala FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ativo = true
    )
  );

-- ─── RLS evento_ministerios ───────────────────────────────────────────────────
ALTER TABLE evento_ministerios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_evento_ministerios"
  ON evento_ministerios FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );

CREATE POLICY "lider_select_evento_ministerios"
  ON evento_ministerios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "lider_update_evento_ministerios"
  ON evento_ministerios FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND papel = 'lider'
        AND ativo = true
    )
  );

CREATE POLICY "membro_select_evento_ministerios"
  ON evento_ministerios FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id = auth.uid()
        AND ministerio_id = evento_ministerios.ministerio_id
        AND ativo = true
    )
  );
