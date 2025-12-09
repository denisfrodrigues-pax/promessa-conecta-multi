-- Add melhor_horario column to visitantes table
ALTER TABLE public.visitantes ADD COLUMN IF NOT EXISTS melhor_horario text;