-- Cria a tabela igrejas (foi criada manualmente no projeto original, sem migration)
CREATE TABLE IF NOT EXISTS igrejas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text        NOT NULL,
  ativa       boolean     DEFAULT true,
  cidade      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE igrejas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "igrejas_public_read"
  ON igrejas FOR SELECT
  USING (true);

CREATE POLICY "igrejas_admin_all"
  ON igrejas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin', 'super_admin'))
  );
