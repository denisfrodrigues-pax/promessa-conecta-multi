-- Criar tabela de junção N:N para voluntário-funções
CREATE TABLE public.ministerio_voluntarios_funcoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_voluntario_id uuid NOT NULL REFERENCES public.ministerio_voluntarios(id) ON DELETE CASCADE,
  funcao_id uuid NOT NULL REFERENCES public.ministerio_funcoes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ministerio_voluntario_id, funcao_id)
);

-- Enable RLS
ALTER TABLE public.ministerio_voluntarios_funcoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage ministerio_voluntarios_funcoes"
  ON public.ministerio_voluntarios_funcoes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can manage their ministry volunteer functions"
  ON public.ministerio_voluntarios_funcoes FOR ALL
  USING (
    has_role(auth.uid(), 'lider'::app_role) 
    AND ministerio_voluntario_id IN (
      SELECT mv.id FROM public.ministerio_voluntarios mv
      JOIN public.ministerios m ON mv.ministerio_id = m.id
      WHERE m.lider_id = get_profile_id(auth.uid())
    )
  );

CREATE POLICY "Volunteers can view their own functions"
  ON public.ministerio_voluntarios_funcoes FOR SELECT
  USING (
    ministerio_voluntario_id IN (
      SELECT id FROM public.ministerio_voluntarios 
      WHERE user_id = auth.uid()
    )
  );

-- Migrar dados existentes: converter funcao_principal_id para a nova tabela
INSERT INTO public.ministerio_voluntarios_funcoes (ministerio_voluntario_id, funcao_id)
SELECT id, funcao_principal_id
FROM public.ministerio_voluntarios
WHERE funcao_principal_id IS NOT NULL;