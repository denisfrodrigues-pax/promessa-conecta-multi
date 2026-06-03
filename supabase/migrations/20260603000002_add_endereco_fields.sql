-- Campos granulares de endereço
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS no_endereco          text;
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS complemento_endereco text;
NOTIFY pgrst, 'reload schema';
