
-- 1) Add slug column to ministerios
ALTER TABLE public.ministerios ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 2) Populate known slugs based on name patterns
UPDATE public.ministerios SET slug = 'kids' WHERE slug IS NULL AND nome ILIKE '%kids%';
UPDATE public.ministerios SET slug = 'ensino' WHERE slug IS NULL AND (nome ILIKE '%ensino%' OR nome ILIKE '%ebd%' OR nome ILIKE '%escola%');
UPDATE public.ministerios SET slug = 'recepcao' WHERE slug IS NULL AND (nome ILIKE '%recep%' OR nome ILIKE '%acolhimento%');
UPDATE public.ministerios SET slug = 'louvor' WHERE slug IS NULL AND (nome ILIKE '%louvor%' OR nome ILIKE '%worship%' OR nome ILIKE '%música%' OR nome ILIKE '%musica%');

-- 3) Update get_my_ministries() to return slug
CREATE OR REPLACE FUNCTION public.get_my_ministries()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'nome', m.nome,
      'slug', m.slug,
      'descricao', m.descricao
    )
  ), '[]'::json)
  INTO result
  FROM ministerio_voluntarios mv
  JOIN ministerios m ON m.id = mv.ministerio_id
  WHERE mv.user_id = auth.uid()
    AND mv.ativo = true
    AND m.ativo = true;

  RETURN result;
END;
$function$;

-- 4) Update is_kids_team to use slug instead of ILIKE
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_voluntarios mv
      JOIN ministerios m ON m.id = mv.ministerio_id
      WHERE mv.user_id = _user_id
        AND mv.ativo = true
        AND m.ativo = true
        AND m.slug = 'kids'
    )
$function$;
