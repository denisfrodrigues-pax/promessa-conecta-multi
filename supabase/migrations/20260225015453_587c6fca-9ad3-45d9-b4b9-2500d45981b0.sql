CREATE POLICY "Ministry members can view fellow members"
ON public.ministerio_usuarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios my
    WHERE my.user_id = auth.uid()
      AND my.ministerio_id = ministerio_usuarios.ministerio_id
      AND my.ativo = true
  )
);