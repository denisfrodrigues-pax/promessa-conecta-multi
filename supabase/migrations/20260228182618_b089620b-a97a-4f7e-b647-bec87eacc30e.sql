
CREATE OR REPLACE FUNCTION public.get_my_ministries()
 RETURNS TABLE(ministerio_id uuid, nome text, slug text, descricao text, papel text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin: return ALL active ministries
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
    SELECT
      m.id as ministerio_id,
      m.nome,
      m.slug,
      m.descricao,
      'admin'::text as papel
    FROM ministerios m
    WHERE m.ativo = true
    ORDER BY m.nome;
    RETURN;
  END IF;

  -- Non-admin: return only linked ministries
  RETURN QUERY
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
END;
$function$;
