-- Create historico_comunicacoes table for audit trail
CREATE TABLE public.historico_comunicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id UUID REFERENCES public.escalas(id) ON DELETE SET NULL,
  voluntario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  mensagem_preview VARCHAR(255),
  detalhes_erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_comunicacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage historico_comunicacoes"
ON public.historico_comunicacoes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leaders can view historico_comunicacoes"
ON public.historico_comunicacoes
FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "System can insert historico_comunicacoes"
ON public.historico_comunicacoes
FOR INSERT
WITH CHECK (true);

-- Add lembrete_automatico_dias_antes column to escalas
ALTER TABLE public.escalas 
ADD COLUMN lembrete_automatico_dias_antes INTEGER DEFAULT NULL;

-- Create index for efficient querying of scheduled reminders
CREATE INDEX idx_escalas_lembrete_dias ON public.escalas(lembrete_automatico_dias_antes, data) 
WHERE lembrete_automatico_dias_antes IS NOT NULL;