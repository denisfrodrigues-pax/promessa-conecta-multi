-- Fix RLS policies with WITH CHECK (true) by restricting to authenticated users only
-- These are system/audit tables that should only allow authenticated users to insert

-- 1. Fix audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix auditoria_financeira INSERT policy
DROP POLICY IF EXISTS "System can insert auditoria" ON public.auditoria_financeira;
CREATE POLICY "Authenticated users can insert auditoria"
ON public.auditoria_financeira
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix historico_comunicacoes INSERT policy
DROP POLICY IF EXISTS "System can insert historico_comunicacoes" ON public.historico_comunicacoes;
CREATE POLICY "Authenticated users can insert historico_comunicacoes"
ON public.historico_comunicacoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix logs_comunicacao INSERT policy
DROP POLICY IF EXISTS "System can insert logs" ON public.logs_comunicacao;
CREATE POLICY "Authenticated users can insert logs"
ON public.logs_comunicacao
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Fix notificacoes INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notificacoes;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- NOTE: visitantes table INSERT policy "Anyone can register as visitor" is intentional
-- for public visitor registration and should remain as is