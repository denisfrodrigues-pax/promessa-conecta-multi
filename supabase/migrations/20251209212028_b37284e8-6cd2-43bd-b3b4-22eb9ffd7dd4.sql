-- Add visitante_id column to bases_membros
ALTER TABLE public.bases_membros 
ADD COLUMN visitante_id uuid REFERENCES public.visitantes(id) ON DELETE SET NULL;

-- Add observacao column for visitor notes
ALTER TABLE public.bases_membros 
ADD COLUMN observacao text;

-- Create unique index for visitors (one active base per visitor)
CREATE UNIQUE INDEX idx_visitante_base_ativa 
ON public.bases_membros (visitante_id) 
WHERE status = 'ativo' AND visitante_id IS NOT NULL;