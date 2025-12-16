-- Add RLS policies to allow members to register their own contributions

-- Policy: Users can insert their own contributions
CREATE POLICY "Users can insert their own contributions"
ON public.transacoes_financeiras
FOR INSERT
TO authenticated
WITH CHECK (criado_por = get_profile_id(auth.uid()));

-- Policy: Users can view their own contributions
CREATE POLICY "Users can view their own contributions"
ON public.transacoes_financeiras
FOR SELECT
TO authenticated
USING (criado_por = get_profile_id(auth.uid()));

-- Insert default contribution categories if they don't exist
INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Dízimo', 'receita', 'Contribuição de dízimo dos membros'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Dízimo');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Oferta', 'receita', 'Ofertas voluntárias'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Oferta');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Missões', 'receita', 'Contribuições para missões'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Missões');

INSERT INTO public.categorias_financeiras (nome, natureza, descricao)
SELECT 'Outro', 'receita', 'Outras contribuições'
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Outro');