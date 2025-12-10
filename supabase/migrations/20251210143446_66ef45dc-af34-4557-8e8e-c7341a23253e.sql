-- Add new fields to bases table to replace grupos functionality
ALTER TABLE public.bases 
ADD COLUMN IF NOT EXISTS dia_semana text,
ADD COLUMN IF NOT EXISTS horario text,
ADD COLUMN IF NOT EXISTS local text,
ADD COLUMN IF NOT EXISTS capacidade integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS visibilidade text DEFAULT 'publico';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bases_visibilidade ON public.bases(visibilidade);
CREATE INDEX IF NOT EXISTS idx_bases_dia_semana ON public.bases(dia_semana);