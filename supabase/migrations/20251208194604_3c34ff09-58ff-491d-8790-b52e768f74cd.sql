-- Create new enum for general escala status
CREATE TYPE public.escala_status_geral AS ENUM ('planejada', 'ativa', 'concluida');

-- Add new columns to escalas table
ALTER TABLE public.escalas
ADD COLUMN IF NOT EXISTS horario text,
ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS status_geral escala_status_geral DEFAULT 'planejada';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_escalas_ministerio_data ON public.escalas(ministerio_id, data);
CREATE INDEX IF NOT EXISTS idx_escalas_responsavel ON public.escalas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_escalas_voluntario ON public.escalas(voluntario_id);
CREATE INDEX IF NOT EXISTS idx_escalas_status_geral ON public.escalas(status_geral);