-- Etapa Música: repertório, músicas do culto, paleta de cores

-- ─── TABELA musicas_repertorio ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS musicas_repertorio (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     uuid        NOT NULL REFERENCES igrejas(id) ON DELETE CASCADE,
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  titulo        text        NOT NULL,
  artista       text,
  tom           text,
  link_youtube  text,
  cifra_url     text,
  observacoes   text,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA musicas_culto ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS musicas_culto (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id       uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id   uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  musica_id       uuid        REFERENCES musicas_repertorio(id) ON DELETE SET NULL,
  titulo_avulso   text,
  artista_avulso  text,
  link_youtube    text,
  ordem           integer     NOT NULL DEFAULT 0,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── TABELA culto_paleta_cores ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS culto_paleta_cores (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id      uuid        NOT NULL REFERENCES eventos_escala(id) ON DELETE CASCADE,
  ministerio_id  uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  cor_primaria   text        NOT NULL,
  cor_secundaria text,
  cor_acento     text,
  observacao     text,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evento_id, ministerio_id)
);

-- ─── TRIGGER updated_at ───────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_musicas_repertorio_updated_at') THEN
    CREATE TRIGGER trg_musicas_repertorio_updated_at
      BEFORE UPDATE ON musicas_repertorio
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_culto_paleta_cores_updated_at') THEN
    CREATE TRIGGER trg_culto_paleta_cores_updated_at
      BEFORE UPDATE ON culto_paleta_cores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── TRIGGER auto-insert em musicas_repertorio ────────────────────────────────
-- Ao inserir em musicas_culto, se musica_id for null e titulo_avulso não for null,
-- cria automaticamente no repertório e preenche musica_id.
CREATE OR REPLACE FUNCTION auto_add_musica_repertorio()
RETURNS TRIGGER AS $$
DECLARE
  v_nova_id  uuid;
  v_church_id uuid;
BEGIN
  IF NEW.musica_id IS NULL AND NEW.titulo_avulso IS NOT NULL THEN
    SELECT church_id INTO v_church_id FROM eventos_escala WHERE id = NEW.evento_id;

    INSERT INTO musicas_repertorio (church_id, ministerio_id, titulo, artista, link_youtube, created_by)
    VALUES (v_church_id, NEW.ministerio_id, NEW.titulo_avulso, NEW.artista_avulso, NEW.link_youtube, NEW.created_by)
    RETURNING id INTO v_nova_id;

    NEW.musica_id = v_nova_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_add_musica_repertorio') THEN
    CREATE TRIGGER trg_auto_add_musica_repertorio
      BEFORE INSERT ON musicas_culto
      FOR EACH ROW EXECUTE FUNCTION auto_add_musica_repertorio();
  END IF;
END $$;

-- ─── RLS musicas_repertorio ───────────────────────────────────────────────────
ALTER TABLE musicas_repertorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_musicas_repertorio"
  ON musicas_repertorio FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_musicas_repertorio"
  ON musicas_repertorio FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_musicas_repertorio"
  ON musicas_repertorio FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_repertorio.ministerio_id AND ativo = true
  ));

-- ─── RLS musicas_culto ────────────────────────────────────────────────────────
ALTER TABLE musicas_culto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_musicas_culto"
  ON musicas_culto FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_musicas_culto"
  ON musicas_culto FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_musicas_culto"
  ON musicas_culto FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = musicas_culto.ministerio_id AND ativo = true
  ));

-- ─── RLS culto_paleta_cores ───────────────────────────────────────────────────
ALTER TABLE culto_paleta_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_culto_paleta_cores"
  ON culto_paleta_cores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin')));

CREATE POLICY "lider_all_culto_paleta_cores"
  ON culto_paleta_cores FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id
      AND papel = 'lider' AND ativo = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id
      AND papel = 'lider' AND ativo = true
  ));

CREATE POLICY "membro_select_culto_paleta_cores"
  ON culto_paleta_cores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ministerio_usuarios
    WHERE user_id = auth.uid() AND ministerio_id = culto_paleta_cores.ministerio_id AND ativo = true
  ));
