-- Add ON DELETE CASCADE to escala_checkins.escala_id foreign key
-- First drop the existing constraint, then re-add with CASCADE

ALTER TABLE public.escala_checkins
DROP CONSTRAINT IF EXISTS escala_checkins_escala_id_fkey;

ALTER TABLE public.escala_checkins
ADD CONSTRAINT escala_checkins_escala_id_fkey
FOREIGN KEY (escala_id) REFERENCES public.escalas(id) ON DELETE CASCADE;