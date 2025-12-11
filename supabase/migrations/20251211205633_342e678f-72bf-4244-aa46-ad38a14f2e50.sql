-- =============================================
-- FIX: RLS para todas as tabelas financeiras
-- Acesso restrito a admin e financeiro
-- =============================================

-- =============================================
-- 1. CATEGORIAS_FINANCEIRAS
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage categorias_financeiras" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated can view categorias_financeiras" ON public.categorias_financeiras;

-- Garantir RLS habilitado
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view categorias"
ON public.categorias_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can insert categorias"
ON public.categorias_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can update categorias"
ON public.categorias_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can delete categorias"
ON public.categorias_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- =============================================
-- 2. CONTAS_FINANCEIRAS
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage contas_financeiras" ON public.contas_financeiras;
DROP POLICY IF EXISTS "Authenticated can view contas_financeiras" ON public.contas_financeiras;

-- Garantir RLS habilitado
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view contas"
ON public.contas_financeiras
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can insert contas"
ON public.contas_financeiras
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can update contas"
ON public.contas_financeiras
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

CREATE POLICY "Admins and financeiro can delete contas"
ON public.contas_financeiras
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- =============================================
-- 3. AUDITORIA_FINANCEIRA
-- =============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can view auditoria_financeira" ON public.auditoria_financeira;
DROP POLICY IF EXISTS "System can insert auditoria" ON public.auditoria_financeira;

-- Garantir RLS habilitado
ALTER TABLE public.auditoria_financeira ENABLE ROW LEVEL SECURITY;

-- Criar políticas restritivas
CREATE POLICY "Admins and financeiro can view auditoria"
ON public.auditoria_financeira
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- Manter política de INSERT para o sistema (triggers/functions)
CREATE POLICY "System can insert auditoria"
ON public.auditoria_financeira
FOR INSERT
WITH CHECK (true);