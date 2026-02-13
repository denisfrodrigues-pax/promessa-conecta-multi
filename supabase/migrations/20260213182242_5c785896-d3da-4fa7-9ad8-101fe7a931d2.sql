
-- 1) Add sala_id (fixed room assignment) to criancas table
ALTER TABLE public.criancas
ADD COLUMN sala_id uuid REFERENCES public.salas_kids(id) ON DELETE SET NULL;

CREATE INDEX idx_criancas_sala_id ON public.criancas(sala_id);

-- 2) Backfill sala_id from last check-in for each child
UPDATE public.criancas c
SET sala_id = sub.sala_id
FROM (
  SELECT DISTINCT ON (crianca_id) crianca_id, sala_id
  FROM public.checkins_kids
  ORDER BY crianca_id, checkin_at DESC
) sub
WHERE c.id = sub.crianca_id AND c.sala_id IS NULL;
