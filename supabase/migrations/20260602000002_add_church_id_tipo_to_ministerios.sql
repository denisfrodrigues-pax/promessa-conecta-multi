-- Adiciona church_id e tipo na tabela ministerios para suporte multi-igreja
ALTER TABLE ministerios
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES igrejas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tipo      text;

CREATE INDEX IF NOT EXISTS idx_ministerios_church_id ON ministerios(church_id);
