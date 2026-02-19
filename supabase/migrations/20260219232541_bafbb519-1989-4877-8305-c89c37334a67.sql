
-- Fase 2: Migrar policies de ministerio_usuarios para can_ministry

-- DROP da policy legada de líder
DROP POLICY IF EXISTS "Leaders can manage their ministry volunteers" ON public.ministerio_usuarios;

-- Nova policy usando can_ministry com 'write'
CREATE POLICY "Ministry leaders can manage volunteers"
ON public.ministerio_usuarios
FOR ALL
USING (can_ministry(auth.uid(), 'write', ministerio_id))
WITH CHECK (can_ministry(auth.uid(), 'write', ministerio_id));
