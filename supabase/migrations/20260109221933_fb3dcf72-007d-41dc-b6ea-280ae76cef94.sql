-- Add profile_id column to bases_membros to link authenticated users to bases
ALTER TABLE public.bases_membros 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for profile_id lookups
CREATE INDEX IF NOT EXISTS idx_bases_membros_profile_id ON public.bases_membros(profile_id);

-- Allow users to view their own base membership
CREATE POLICY "Users can view their own base membership"
ON public.bases_membros
FOR SELECT
USING (profile_id = get_profile_id(auth.uid()));

-- Create table for personal notes linked to base presence
CREATE TABLE public.notas_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_id uuid NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  conteudo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, base_id, data)
);

-- Enable RLS
ALTER TABLE public.notas_base ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notes (private)
CREATE POLICY "Users can manage their own notes"
ON public.notas_base
FOR ALL
USING (profile_id = get_profile_id(auth.uid()));

-- Allow users to register their own presence for bases
CREATE POLICY "Users can register their own base presence"
ON public.presencas
FOR INSERT
WITH CHECK (
  usuario_id = get_profile_id(auth.uid()) 
  AND referencia_tipo = 'base'
);

-- Trigger for updated_at on notas_base
CREATE TRIGGER update_notas_base_updated_at
BEFORE UPDATE ON public.notas_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();