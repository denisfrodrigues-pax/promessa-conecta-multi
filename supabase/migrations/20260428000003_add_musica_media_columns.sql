-- Add media link columns to musicas_repertorio
ALTER TABLE musicas_repertorio
  ADD COLUMN IF NOT EXISTS link_deezer text,
  ADD COLUMN IF NOT EXISTS link_spotify text,
  ADD COLUMN IF NOT EXISTS link_cifraclub text,
  ADD COLUMN IF NOT EXISTS capa_url text;

-- Add media link columns to musicas_culto
ALTER TABLE musicas_culto
  ADD COLUMN IF NOT EXISTS link_deezer text,
  ADD COLUMN IF NOT EXISTS link_spotify text,
  ADD COLUMN IF NOT EXISTS link_cifraclub text,
  ADD COLUMN IF NOT EXISTS capa_url text;
