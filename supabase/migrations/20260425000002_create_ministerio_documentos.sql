-- Etapa 2: Tabela de documentos por ministério + RLS + bucket

-- ─── TABELA ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ministerio_documentos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id uuid        NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  descricao    text,
  arquivo_url  text        NOT NULL,
  arquivo_nome text        NOT NULL,
  arquivo_tipo text        NOT NULL,
  criado_por   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE ministerio_documentos ENABLE ROW LEVEL SECURITY;

-- Admin e super_admin: acesso total
CREATE POLICY "admin_all_ministerio_documentos"
  ON ministerio_documentos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'super_admin')
    )
  );

-- Membros do ministério: somente leitura
CREATE POLICY "member_select_ministerio_documentos"
  ON ministerio_documentos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND ativo         = true
    )
  );

-- Líderes do ministério: inserir
CREATE POLICY "leader_insert_ministerio_documentos"
  ON ministerio_documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND papel         = 'lider'
        AND ativo         = true
    )
  );

-- Líderes do ministério: deletar
CREATE POLICY "leader_delete_ministerio_documentos"
  ON ministerio_documentos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ministerio_usuarios
      WHERE user_id       = auth.uid()
        AND ministerio_id = ministerio_documentos.ministerio_id
        AND papel         = 'lider'
        AND ativo         = true
    )
  );

-- ─── STORAGE BUCKET (criar manualmente no dashboard) ─────────────────────────
-- Nome do bucket: ministerio-docs
-- Tipo: Public (para simplificar acesso via URL direta)
-- A segurança é garantida pelas RLS da tabela ministerio_documentos
--
-- Políticas recomendadas no bucket (via SQL Editor do Supabase):
--
-- CREATE POLICY "autenticados_leem_ministerio_docs"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'ministerio-docs');
--
-- CREATE POLICY "lideres_e_admins_upload_ministerio_docs"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'ministerio-docs');
--
-- CREATE POLICY "lideres_e_admins_delete_ministerio_docs"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'ministerio-docs');
