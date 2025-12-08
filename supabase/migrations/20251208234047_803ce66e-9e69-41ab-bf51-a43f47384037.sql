-- Add funcao_principal_id column to ministerio_voluntarios
ALTER TABLE public.ministerio_voluntarios
ADD COLUMN funcao_principal_id UUID REFERENCES public.ministerio_funcoes(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_ministerio_voluntarios_funcao ON public.ministerio_voluntarios(funcao_principal_id);

-- Update RLS policy to allow volunteers to read their own records
CREATE POLICY "Volunteers can view their own volunteer records"
ON public.ministerio_voluntarios
FOR SELECT
USING (user_id = auth.uid());