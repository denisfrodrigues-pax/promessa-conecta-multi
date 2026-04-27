
-- Add missing FK from checkins_kids.sala_id to salas.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'checkins_kids_sala_id_fkey'
  ) THEN
    ALTER TABLE checkins_kids
    ADD CONSTRAINT checkins_kids_sala_id_fkey
    FOREIGN KEY (sala_id) REFERENCES salas(id);
  END IF;
END $$;
