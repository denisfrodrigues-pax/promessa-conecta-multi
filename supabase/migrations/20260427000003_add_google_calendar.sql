-- Fase 4: adiciona campo de URL do Google Calendar embed às configurações
ALTER TABLE configuracoes_instituicao
  ADD COLUMN IF NOT EXISTS google_calendar_embed_url text;
