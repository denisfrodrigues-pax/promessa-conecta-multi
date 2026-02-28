
-- Add missing FK from checkins_kids.sala_id to salas.id
ALTER TABLE checkins_kids
ADD CONSTRAINT checkins_kids_sala_id_fkey
FOREIGN KEY (sala_id) REFERENCES salas(id);
