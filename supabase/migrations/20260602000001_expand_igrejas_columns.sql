-- Expande a tabela igrejas com campos de identidade visual, localização e responsável
ALTER TABLE igrejas
  ADD COLUMN IF NOT EXISTS slug              text,
  ADD COLUMN IF NOT EXISTS slogan            text,
  ADD COLUMN IF NOT EXISTS versiculo         text,
  ADD COLUMN IF NOT EXISTS versiculo_referencia text,
  ADD COLUMN IF NOT EXISTS logo_url          text,
  ADD COLUMN IF NOT EXISTS cor_primaria      text DEFAULT '#2D6A4F',
  ADD COLUMN IF NOT EXISTS cor_secundaria    text DEFAULT '#1B4332',
  ADD COLUMN IF NOT EXISTS foto_hero_urls    text[],
  ADD COLUMN IF NOT EXISTS foto_login_url    text,
  ADD COLUMN IF NOT EXISTS estado            text,
  ADD COLUMN IF NOT EXISTS endereco          text,
  ADD COLUMN IF NOT EXISTS whatsapp          text,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS youtube_url       text,
  ADD COLUMN IF NOT EXISTS facebook_url      text,
  ADD COLUMN IF NOT EXISTS site_url          text,
  ADD COLUMN IF NOT EXISTS responsavel_nome  text,
  ADD COLUMN IF NOT EXISTS responsavel_email text,
  ADD COLUMN IF NOT EXISTS responsavel_telefone text,
  ADD COLUMN IF NOT EXISTS plano             text DEFAULT 'teste';

-- Índice único para slug (permite null em igrejas legadas)
CREATE UNIQUE INDEX IF NOT EXISTS igrejas_slug_unique ON igrejas (slug) WHERE slug IS NOT NULL;
