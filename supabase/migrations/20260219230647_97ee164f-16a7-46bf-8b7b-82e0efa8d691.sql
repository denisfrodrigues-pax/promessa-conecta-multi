
-- 1. Atualizar can_ministry para modelo híbrido (ministerio_usuarios + ministerios.lider_id)
CREATE OR REPLACE FUNCTION public.can_ministry(_user_id uuid, _action text, _ministerio_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    has_role(_user_id, 'admin'::app_role)
    OR (
      _action = 'read' AND (
        -- Novo modelo: ministerio_usuarios
        EXISTS (
          SELECT 1 FROM ministerio_usuarios
          WHERE user_id = _user_id
            AND ministerio_id = _ministerio_id
            AND ativo = true
        )
        -- Legado: ministerios.lider_id
        OR EXISTS (
          SELECT 1 FROM ministerios m
          JOIN profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id
            AND p.user_id = _user_id
        )
      )
    )
    OR (
      _action = 'write' AND (
        -- Novo modelo: papel = lider
        EXISTS (
          SELECT 1 FROM ministerio_usuarios
          WHERE user_id = _user_id
            AND ministerio_id = _ministerio_id
            AND papel = 'lider'
            AND ativo = true
        )
        -- Legado: ministerios.lider_id
        OR EXISTS (
          SELECT 1 FROM ministerios m
          JOIN profiles p ON p.id = m.lider_id
          WHERE m.id = _ministerio_id
            AND p.user_id = _user_id
        )
      )
    );
$$;

-- 2. Substituir policies de escalas para usar can_ministry

-- DROP das policies antigas de líder
DROP POLICY IF EXISTS "Leaders can view escalas of their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can insert escalas in their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can update escalas of their ministerios" ON public.escalas;
DROP POLICY IF EXISTS "Leaders can delete escalas of their ministerios" ON public.escalas;

-- SELECT: can_ministry com 'read'
CREATE POLICY "Ministry members can view escalas"
ON public.escalas
FOR SELECT
USING (can_ministry(auth.uid(), 'read', ministerio_id));

-- INSERT: can_ministry com 'write'
CREATE POLICY "Ministry leaders can insert escalas"
ON public.escalas
FOR INSERT
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));

-- UPDATE: can_ministry com 'write'
CREATE POLICY "Ministry leaders can update escalas"
ON public.escalas
FOR UPDATE
USING (can_ministry(auth.uid(), 'write', ministerio_id))
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));

-- DELETE: can_ministry com 'write'
CREATE POLICY "Ministry leaders can delete escalas"
ON public.escalas
FOR DELETE
USING (can_ministry(auth.uid(), 'write', ministerio_id));
