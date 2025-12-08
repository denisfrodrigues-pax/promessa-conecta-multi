-- Create table ministerio_funcoes
CREATE TABLE public.ministerio_funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ministerio_id, nome)
);

-- Enable RLS
ALTER TABLE public.ministerio_funcoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "Admins can manage ministerio_funcoes"
ON public.ministerio_funcoes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Leader: can read/manage functions of their own ministry
CREATE POLICY "Leaders can manage their ministry functions"
ON public.ministerio_funcoes
FOR ALL
USING (
  has_role(auth.uid(), 'lider'::app_role) 
  AND ministerio_id IN (
    SELECT id FROM public.ministerios 
    WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- Authenticated users can read active functions
CREATE POLICY "Authenticated users can view active functions"
ON public.ministerio_funcoes
FOR SELECT
USING (ativo = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lider'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ministerio_funcoes_updated_at
BEFORE UPDATE ON public.ministerio_funcoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();