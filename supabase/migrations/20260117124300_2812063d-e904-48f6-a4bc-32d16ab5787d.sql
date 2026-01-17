-- =============================================
-- MIGRATION: Correção completa do módulo de Bases
-- =============================================

-- 1) Adicionar campos de endereço e foto na tabela bases
ALTER TABLE public.bases
  ADD COLUMN IF NOT EXISTS foto_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rua text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS numero text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bairro text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cidade text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS uf text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_lider text DEFAULT NULL;

-- 2) Ajustar RLS de bases para permitir leitura pública de bases ativas e públicas
DROP POLICY IF EXISTS "Authenticated can view active bases" ON public.bases;

CREATE POLICY "Anyone can view public active bases"
ON public.bases
FOR SELECT
USING (
  (status = 'ativo' AND visibilidade = 'publico')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'lider'::app_role)
);

-- 3) Ajustar RLS de bases_membros para líderes verem membros das suas bases
DROP POLICY IF EXISTS "Leaders can manage their base members" ON public.bases_membros;

CREATE POLICY "Leaders can manage their base members"
ON public.bases_membros
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT id FROM public.bases WHERE lider_id = public.get_profile_id(auth.uid())
    )
  )
);

-- 4) Adicionar trigger para vincular líder automaticamente como membro quando definido
CREATE OR REPLACE FUNCTION public.auto_vincular_lider_base()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se um líder foi definido ou alterado
  IF NEW.lider_id IS NOT NULL AND (OLD.lider_id IS NULL OR OLD.lider_id != NEW.lider_id) THEN
    -- Verificar se o líder já está vinculado
    IF NOT EXISTS (
      SELECT 1 FROM bases_membros 
      WHERE base_id = NEW.id 
        AND profile_id = NEW.lider_id 
        AND status = 'ativo'
    ) THEN
      -- Inserir o líder como membro ativo
      INSERT INTO bases_membros (base_id, profile_id, status, observacao)
      VALUES (NEW.id, NEW.lider_id, 'ativo', 'Líder da base (vinculado automaticamente)');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_vincular_lider_base ON public.bases;

CREATE TRIGGER trigger_auto_vincular_lider_base
AFTER INSERT OR UPDATE OF lider_id ON public.bases
FOR EACH ROW
EXECUTE FUNCTION public.auto_vincular_lider_base();

-- 5) Ajustar RLS para membros verem sua própria base
DROP POLICY IF EXISTS "Users can view their own base membership" ON public.bases_membros;

CREATE POLICY "Users can view their own base membership"
ON public.bases_membros
FOR SELECT
TO authenticated
USING (
  profile_id = public.get_profile_id(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'lider'::app_role)
    AND base_id IN (
      SELECT id FROM public.bases WHERE lider_id = public.get_profile_id(auth.uid())
    )
  )
);