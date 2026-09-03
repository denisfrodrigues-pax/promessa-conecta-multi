-- Contribuições lançadas por um admin em nome de um membro (transacoes_financeiras.membro_id)
-- eram invisíveis para esse membro: a única política de SELECT para o papel
-- "membro" exigia criado_por = get_profile_id(auth.uid()), que só cobre
-- contribuições que o próprio membro registrou.
--
-- get_membro_id() segue o mesmo padrão de get_profile_id(): SECURITY DEFINER
-- para resolver membros.id sem disparar a RLS de "membros" (que por sua vez
-- consulta "profiles"). Isso é necessário porque a política de "profiles"
-- "Leaders can view their ministry volunteers basic info" já consulta
-- transacoes_financeiras (ramo financeiro) — se a política abaixo consultasse
-- "membros" diretamente (com sua RLS ativa), o ciclo
-- transacoes_financeiras -> membros -> profiles -> transacoes_financeiras
-- causa "infinite recursion detected in policy for relation profiles".
CREATE FUNCTION public.get_membro_id(_profile_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.membros WHERE user_id = _profile_id LIMIT 1;
$function$;

CREATE POLICY "Users can view contributions linked to their membro record"
ON public.transacoes_financeiras
FOR SELECT
TO authenticated
USING (
  membro_id = public.get_membro_id(public.get_profile_id(auth.uid()))
);
