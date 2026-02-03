-- Add new fields to bases table
ALTER TABLE public.bases 
ADD COLUMN IF NOT EXISTS anfitrioes TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bases.anfitrioes IS 'Nome(s) do(s) anfitrião(ões) da base';
COMMENT ON COLUMN public.bases.observacoes IS 'Observações gerais sobre a base';