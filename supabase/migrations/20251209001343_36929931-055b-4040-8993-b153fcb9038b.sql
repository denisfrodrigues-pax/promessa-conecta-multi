-- Add confirmado_em timestamp field to escalas table for tracking confirmation time
ALTER TABLE public.escalas 
ADD COLUMN confirmado_em TIMESTAMPTZ NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.escalas.confirmado_em IS 'Timestamp when the volunteer confirmed or refused the schedule';