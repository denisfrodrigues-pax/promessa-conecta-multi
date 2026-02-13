
DROP FUNCTION IF EXISTS public.get_my_ministries();

CREATE OR REPLACE FUNCTION public.get_my_ministries()
 RETURNS TABLE (ministerio_id uuid, nome text, slug text, descricao text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT m.id AS ministerio_id, m.nome, m.slug, m.descricao
  FROM ministerio_voluntarios mv
  JOIN ministerios m ON m.id = mv.ministerio_id
  WHERE mv.user_id = auth.uid()
    AND mv.ativo = true
    AND m.ativo = true;
$$;
