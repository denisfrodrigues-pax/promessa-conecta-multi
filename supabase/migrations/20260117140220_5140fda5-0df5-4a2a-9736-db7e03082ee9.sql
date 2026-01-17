-- A) CORRIGIR escala_checkins.user_id para usar auth.uid() como default
ALTER TABLE public.escala_checkins 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Recriar as políticas RLS de escala_checkins para garantir consistência
DROP POLICY IF EXISTS "Voluntários inserem próprio check-in" ON public.escala_checkins;
DROP POLICY IF EXISTS "Admin vê todos check-ins" ON public.escala_checkins;
DROP POLICY IF EXISTS "Líder vê check-ins dos ministérios que lidera" ON public.escala_checkins;
DROP POLICY IF EXISTS "Voluntário vê próprios check-ins" ON public.escala_checkins;

-- INSERT: voluntário pode inserir apenas para escalas onde ele é o voluntário
CREATE POLICY "Voluntários inserem próprio check-in"
ON public.escala_checkins FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.profiles p ON p.id = e.voluntario_id
    WHERE e.id = escala_id AND p.user_id = auth.uid()
  )
);

-- SELECT: Admin vê tudo
CREATE POLICY "Admin vê todos check-ins"
ON public.escala_checkins FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- SELECT: Líder vê check-ins de ministérios que lidera
CREATE POLICY "Líder vê check-ins dos ministérios que lidera"
ON public.escala_checkins FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.ministerios m ON m.id = e.ministerio_id
    JOIN public.profiles p ON p.id = m.lider_id
    WHERE e.id = escala_id AND p.user_id = auth.uid()
  )
);

-- SELECT: Voluntário vê próprios check-ins
CREATE POLICY "Voluntário vê próprios check-ins"
ON public.escala_checkins FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- B) Garantir que líder pode ver presenças da própria base (com cast correto)
DROP POLICY IF EXISTS "Líder vê presenças da própria base" ON public.presencas;
CREATE POLICY "Líder vê presenças da própria base"
ON public.presencas FOR SELECT TO authenticated
USING (
  referencia_tipo = 'base' AND
  EXISTS (
    SELECT 1 FROM public.bases b
    JOIN public.profiles p ON p.id = b.lider_id
    WHERE b.id = referencia_id::uuid AND p.user_id = auth.uid()
  )
);

-- C) Garantir que admin pode DELETE em bases
DROP POLICY IF EXISTS "Admin pode deletar bases" ON public.bases;
CREATE POLICY "Admin pode deletar bases"
ON public.bases FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- D) Criar política para admin e líder fazerem upload no bucket bases-fotos
DROP POLICY IF EXISTS "Todos podem ver fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem fazer upload de fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem atualizar fotos de bases" ON storage.objects;
DROP POLICY IF EXISTS "Admin e líder podem deletar fotos de bases" ON storage.objects;

CREATE POLICY "Todos podem ver fotos de bases"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bases-fotos');

CREATE POLICY "Admin e líder podem fazer upload de fotos de bases"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);

CREATE POLICY "Admin e líder podem atualizar fotos de bases"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);

CREATE POLICY "Admin e líder podem deletar fotos de bases"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'bases-fotos' AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lider'))
);