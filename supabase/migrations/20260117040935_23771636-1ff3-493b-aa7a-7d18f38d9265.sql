-- Policy para user_roles: permitir SELECT para admin/financeiro/lider
CREATE POLICY "Leaders can view user_roles for scheduling"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role) OR
  public.has_role(auth.uid(), 'lider'::app_role)
);

-- Policy para profiles: permitir SELECT para admin/financeiro/lider
CREATE POLICY "Leaders can view profiles for scheduling"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'financeiro'::app_role) OR
  public.has_role(auth.uid(), 'lider'::app_role)
);