-- =====================================================
-- 1. ESCALA_CHECKINS - Check-in de voluntários no dia
-- =====================================================
CREATE TABLE IF NOT EXISTS public.escala_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id uuid NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escala_id, user_id)
);

-- Enable RLS
ALTER TABLE public.escala_checkins ENABLE ROW LEVEL SECURITY;

-- INSERT: apenas o voluntário da escala pode fazer check-in
CREATE POLICY "Volunteer can checkin own escala"
ON public.escala_checkins
FOR INSERT
WITH CHECK (
  user_id = (SELECT get_profile_id(auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.escalas
    WHERE escalas.id = escala_id
      AND escalas.voluntario_id = get_profile_id(auth.uid())
  )
);

-- SELECT: admin vê tudo, líder vê de seus ministérios, voluntário vê os seus
CREATE POLICY "Admin can view all checkins"
ON public.escala_checkins
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leader can view ministry checkins"
ON public.escala_checkins
FOR SELECT
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.ministerios m ON e.ministerio_id = m.id
    WHERE e.id = escala_id
      AND m.lider_id = get_profile_id(auth.uid())
  )
);

CREATE POLICY "Volunteer can view own checkins"
ON public.escala_checkins
FOR SELECT
USING (user_id = get_profile_id(auth.uid()));

-- =====================================================
-- 2. Ajustar RLS PRESENCAS para líder ver de sua base
-- =====================================================
-- Drop and recreate policy for leader to view base presences
DROP POLICY IF EXISTS "Leaders and admins can manage presencas" ON public.presencas;

CREATE POLICY "Admins can manage all presencas"
ON public.presencas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can manage their base presencas"
ON public.presencas
FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role)
  AND referencia_tipo = 'base'
  AND referencia_id IN (
    SELECT id FROM public.bases WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- =====================================================
-- 3. Bucket para fotos das bases (se não existir)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('bases-fotos', 'bases-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
CREATE POLICY "Anyone can view base photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'bases-fotos');

CREATE POLICY "Admin and leader can upload base photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

CREATE POLICY "Admin and leader can update base photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

CREATE POLICY "Admin and leader can delete base photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bases-fotos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'lider'::app_role)
  )
);

-- =====================================================
-- 4. Cascade delete para bases_membros quando base deletada
-- =====================================================
ALTER TABLE public.bases_membros
DROP CONSTRAINT IF EXISTS bases_membros_base_id_fkey;

ALTER TABLE public.bases_membros
ADD CONSTRAINT bases_membros_base_id_fkey
FOREIGN KEY (base_id) REFERENCES public.bases(id) ON DELETE CASCADE;