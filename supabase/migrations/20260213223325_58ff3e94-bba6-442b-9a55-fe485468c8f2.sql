
-- 1) Add RLS policies for responsaveis: kids team can SELECT/INSERT/UPDATE
CREATE POLICY "Kids team can view responsaveis"
ON public.responsaveis
FOR SELECT
USING (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can insert responsaveis"
ON public.responsaveis
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can update responsaveis"
ON public.responsaveis
FOR UPDATE
USING (is_kids_team(auth.uid()));

-- 2) Add RLS policies for criancas_responsaveis: kids team can manage
CREATE POLICY "Kids team can insert criancas_responsaveis"
ON public.criancas_responsaveis
FOR INSERT
WITH CHECK (is_kids_team(auth.uid()));

CREATE POLICY "Kids team can delete criancas_responsaveis"
ON public.criancas_responsaveis
FOR DELETE
USING (is_kids_team(auth.uid()));

-- 3) Create get_my_ministries() RPC - returns active ministries for the logged-in user
CREATE OR REPLACE FUNCTION public.get_my_ministries()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', m.id,
      'nome', m.nome,
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
$$;
