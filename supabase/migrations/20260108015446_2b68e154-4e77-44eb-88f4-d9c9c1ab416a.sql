-- Add SELECT policy for authenticated users to view active members
CREATE POLICY "Authenticated can view active membros"
ON public.membros
FOR SELECT
USING (status = 'ativo' OR has_role(auth.uid(), 'admin'::app_role));