-- Create acompanhamentos table
CREATE TABLE public.acompanhamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitante_id UUID NOT NULL REFERENCES public.visitantes(id) ON DELETE CASCADE,
  base_id UUID NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('novo', 'contato_iniciado', 'em_acompanhamento', 'concluido')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_acompanhamentos_visitante ON public.acompanhamentos(visitante_id);
CREATE INDEX idx_acompanhamentos_base ON public.acompanhamentos(base_id);
CREATE INDEX idx_acompanhamentos_status ON public.acompanhamentos(status);

-- Enable RLS
ALTER TABLE public.acompanhamentos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage acompanhamentos"
ON public.acompanhamentos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can view acompanhamentos"
ON public.acompanhamentos
FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_acompanhamentos_updated_at
BEFORE UPDATE ON public.acompanhamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();