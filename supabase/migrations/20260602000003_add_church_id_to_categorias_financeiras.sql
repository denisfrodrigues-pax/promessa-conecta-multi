-- Adiciona church_id na tabela categorias_financeiras para suporte multi-igreja
ALTER TABLE categorias_financeiras
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES igrejas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_church_id ON categorias_financeiras(church_id);
