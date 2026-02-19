
-- 1. Create enum papel_ministerial
CREATE TYPE public.papel_ministerial AS ENUM ('lider', 'voluntario');

-- 2. Rename table ministerio_voluntarios → ministerio_usuarios
ALTER TABLE public.ministerio_voluntarios RENAME TO ministerio_usuarios;

-- 3. Add 'papel' column with default 'voluntario'
ALTER TABLE public.ministerio_usuarios 
  ADD COLUMN papel papel_ministerial NOT NULL DEFAULT 'voluntario';

-- 4. Populate 'papel' = 'lider' for existing leaders
UPDATE public.ministerio_usuarios mu
SET papel = 'lider'
FROM public.ministerios m
JOIN public.profiles p ON p.id = m.lider_id
WHERE mu.ministerio_id = m.id
  AND mu.user_id = p.user_id
  AND m.lider_id IS NOT NULL;

-- 5. Insert missing leaders
INSERT INTO public.ministerio_usuarios (ministerio_id, user_id, papel, ativo)
SELECT m.id, p.user_id, 'lider', true
FROM public.ministerios m
JOIN public.profiles p ON p.id = m.lider_id
WHERE m.lider_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.ministerio_usuarios mu
    WHERE mu.ministerio_id = m.id AND mu.user_id = p.user_id
  );

-- 6. Create authorization function
CREATE OR REPLACE FUNCTION public.can_ministry(
  _user_id uuid,
  _action text,
  _ministerio_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR (
      _action = 'read' AND EXISTS (
        SELECT 1 FROM ministerio_usuarios
        WHERE user_id = _user_id
          AND ministerio_id = _ministerio_id
          AND ativo = true
      )
    )
    OR (
      _action = 'write' AND EXISTS (
        SELECT 1 FROM ministerio_usuarios
        WHERE user_id = _user_id
          AND ministerio_id = _ministerio_id
          AND papel = 'lider'
          AND ativo = true
      )
    );
$$;

-- 7. Drop and recreate get_my_ministries with new return type
DROP FUNCTION IF EXISTS public.get_my_ministries();

CREATE FUNCTION public.get_my_ministries()
RETURNS TABLE(ministerio_id uuid, nome text, slug text, descricao text, papel text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id as ministerio_id,
    m.nome,
    m.slug,
    m.descricao,
    mu.papel::text
  FROM ministerio_usuarios mu
  JOIN ministerios m ON m.id = mu.ministerio_id
  WHERE mu.user_id = auth.uid()
    AND mu.ativo = true
    AND m.ativo = true
  ORDER BY m.nome;
$$;

-- 8. Update is_kids_team to use new table name
CREATE OR REPLACE FUNCTION public.is_kids_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM ministerio_usuarios mu
      JOIN ministerios m ON m.id = mu.ministerio_id
      WHERE mu.user_id = _user_id
        AND mu.ativo = true
        AND m.ativo = true
        AND m.slug = 'kids'
    )
$$;

-- 9. Index for performance
CREATE INDEX IF NOT EXISTS idx_ministerio_usuarios_papel 
ON public.ministerio_usuarios (user_id, ministerio_id, papel, ativo);
