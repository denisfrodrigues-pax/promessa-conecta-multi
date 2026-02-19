
-- Fase 3: Migrar policies de ministerio_voluntarios_funcoes e escala_checkins

-- === ministerio_voluntarios_funcoes ===

-- DROP policy legada de líder
DROP POLICY IF EXISTS "Leaders can manage their ministry volunteer functions" ON public.ministerio_voluntarios_funcoes;

-- Nova policy usando can_ministry via subquery no ministerio_id
CREATE POLICY "Ministry leaders can manage volunteer functions"
ON public.ministerio_voluntarios_funcoes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
      AND can_ministry(auth.uid(), 'write', mu.ministerio_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ministerio_usuarios mu
    WHERE mu.id = ministerio_voluntarios_funcoes.ministerio_voluntario_id
      AND can_ministry(auth.uid(), 'write', mu.ministerio_id)
  )
);

-- === escala_checkins ===

-- DROP policies legadas de líder
DROP POLICY IF EXISTS "Leader can view ministry checkins" ON public.escala_checkins;
DROP POLICY IF EXISTS "Líder vê check-ins dos ministérios que lidera" ON public.escala_checkins;

-- Nova policy de SELECT para líderes usando can_ministry
CREATE POLICY "Ministry leaders can view checkins"
ON public.escala_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM escalas e
    WHERE e.id = escala_checkins.escala_id
      AND can_ministry(auth.uid(), 'read', e.ministerio_id)
  )
);
