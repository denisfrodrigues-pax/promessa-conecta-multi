-- Adiciona colunas de missão, visão, história, contato e horários à tabela igrejas
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS missao        text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS visao         text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS historia      text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS email         text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS telefone      text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS google_maps_url text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS horario_ebd   text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS horario_culto text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS horario_bases text;

-- Garantir default em cor_secundaria
ALTER TABLE igrejas ALTER COLUMN cor_secundaria SET DEFAULT '#1B4332';

NOTIFY pgrst, 'reload schema';
