-- Add missing fields for contact information
ALTER TABLE public.configuracoes_instituicao
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS horario_ebd text,
ADD COLUMN IF NOT EXISTS horario_culto text;