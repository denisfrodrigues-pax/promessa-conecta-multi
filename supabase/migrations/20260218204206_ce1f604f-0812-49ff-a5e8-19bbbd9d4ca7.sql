
ALTER TABLE escalas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'ausente'));
