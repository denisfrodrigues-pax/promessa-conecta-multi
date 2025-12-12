-- Drop existing public SELECT policy on configuracoes_instituicao
DROP POLICY IF EXISTS "Anyone authenticated can view configuracoes" ON public.configuracoes_instituicao;

-- Create restricted SELECT policy: only admins can view
CREATE POLICY "Only admins can view configuracoes"
ON public.configuracoes_instituicao
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));