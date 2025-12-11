-- Restrict checkins_kids to parents and admins only
DROP POLICY IF EXISTS "Authenticated can view checkins_kids" ON checkins_kids;

CREATE POLICY "Parents and staff can view checkins_kids" ON checkins_kids
  FOR SELECT USING (
    responsavel_id IN (
      SELECT cr.responsavel_id FROM criancas_responsaveis cr 
      JOIN criancas c ON c.id = cr.crianca_id 
      WHERE c.responsavel_id = get_profile_id(auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );