-- Create responsaveis table for guardians
CREATE TABLE public.responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for children and guardians
CREATE TABLE public.criancas_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  tipo_relacao TEXT DEFAULT 'responsável',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crianca_id, responsavel_id)
);

-- Create salas_kids table for rooms
CREATE TABLE public.salas_kids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  capacidade INTEGER DEFAULT 20,
  observacao TEXT,
  status TEXT DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checkins_kids table
CREATE TABLE public.checkins_kids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crianca_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id),
  sala_id UUID NOT NULL REFERENCES public.salas_kids(id),
  checkin_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checkout_at TIMESTAMP WITH TIME ZONE,
  checkout_responsavel_id UUID REFERENCES public.responsaveis(id),
  status TEXT NOT NULL DEFAULT 'presente',
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criancas_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salas_kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins_kids ENABLE ROW LEVEL SECURITY;

-- RLS policies for responsaveis
CREATE POLICY "Admins can manage responsaveis" ON public.responsaveis
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view responsaveis" ON public.responsaveis
  FOR SELECT USING (true);

-- RLS policies for criancas_responsaveis
CREATE POLICY "Admins can manage criancas_responsaveis" ON public.criancas_responsaveis
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view criancas_responsaveis" ON public.criancas_responsaveis
  FOR SELECT USING (true);

-- RLS policies for salas_kids
CREATE POLICY "Admins can manage salas_kids" ON public.salas_kids
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view salas_kids" ON public.salas_kids
  FOR SELECT USING (true);

-- RLS policies for checkins_kids
CREATE POLICY "Admins can manage checkins_kids" ON public.checkins_kids
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view checkins_kids" ON public.checkins_kids
  FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_responsaveis_updated_at
  BEFORE UPDATE ON public.responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salas_kids_updated_at
  BEFORE UPDATE ON public.salas_kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkins_kids_updated_at
  BEFORE UPDATE ON public.checkins_kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();