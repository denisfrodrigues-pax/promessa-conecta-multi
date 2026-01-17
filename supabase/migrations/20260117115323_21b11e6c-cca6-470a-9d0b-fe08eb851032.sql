-- Remove a política atual que dá acesso total a líderes
DROP POLICY IF EXISTS "Admins and leaders can manage escalas" ON public.escalas;

-- Policy: Admin tem acesso total
CREATE POLICY "Admins can manage all escalas"
ON public.escalas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Líder pode SELECT escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can view escalas of their ministerios"
ON public.escalas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode INSERT escalas nos ministérios onde ele é líder
CREATE POLICY "Leaders can insert escalas in their ministerios"
ON public.escalas
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode UPDATE escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can update escalas of their ministerios"
ON public.escalas
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Policy: Líder pode DELETE escalas dos ministérios onde ele é líder
CREATE POLICY "Leaders can delete escalas of their ministerios"
ON public.escalas
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'lider'::app_role) AND
  ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = public.get_profile_id(auth.uid())
  )
);

-- Garantir que a política de SELECT para voluntários existe (ver suas próprias escalas)
-- Primeiro remover se existir para recriar
DROP POLICY IF EXISTS "Voluntarios can view their escalas" ON public.escalas;

-- Policy: Voluntário pode ver suas próprias escalas
CREATE POLICY "Voluntarios can view their escalas"
ON public.escalas
FOR SELECT
TO authenticated
USING (voluntario_id = public.get_profile_id(auth.uid()));

-- Manter a política de UPDATE para voluntários (confirmar/recusar)
-- Apenas pode atualizar status da própria escala
DROP POLICY IF EXISTS "Voluntarios can update their escalas status" ON public.escalas;

CREATE POLICY "Voluntarios can update their own status"
ON public.escalas
FOR UPDATE
TO authenticated
USING (voluntario_id = public.get_profile_id(auth.uid()))
WITH CHECK (voluntario_id = public.get_profile_id(auth.uid()));