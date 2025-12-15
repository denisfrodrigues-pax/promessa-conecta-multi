-- Adicionar política para permitir usuários autenticados verem campos públicos da configuração
DROP POLICY IF EXISTS "Only admins can view configuracoes" ON public.configuracoes_instituicao;

-- Criar nova política que permite todos autenticados lerem (apenas dados não-sensíveis serão expostos via select no código)
CREATE POLICY "Authenticated users can view public config" 
ON public.configuracoes_instituicao 
FOR SELECT 
TO authenticated
USING (true);