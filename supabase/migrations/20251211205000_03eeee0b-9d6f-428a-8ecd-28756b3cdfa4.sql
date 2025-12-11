-- =============================================
-- STEP 2: Corrigir RLS da tabela transacoes_financeiras
-- =============================================

-- 1. Remover política permissiva que expõe dados financeiros
DROP POLICY IF EXISTS "Authenticated can view transacoes_financeiras" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Admins can manage transacoes_financeiras" ON public.transacoes_financeiras;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- 3. Política: Admins e Financeiros podem VER todas as transações
CREATE POLICY "Admins and financeiro can view transacoes"
ON public.transacoes_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 4. Política: Admins e Financeiros podem INSERIR transações
CREATE POLICY "Admins and financeiro can insert transacoes"
ON public.transacoes_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 5. Política: Admins e Financeiros podem ATUALIZAR transações
CREATE POLICY "Admins and financeiro can update transacoes"
ON public.transacoes_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- 6. Política: Admins e Financeiros podem DELETAR transações
CREATE POLICY "Admins and financeiro can delete transacoes"
ON public.transacoes_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);