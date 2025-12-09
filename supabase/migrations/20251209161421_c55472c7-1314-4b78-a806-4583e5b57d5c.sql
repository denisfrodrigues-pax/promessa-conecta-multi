-- Create visitantes table
CREATE TABLE public.visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  data_visita DATE DEFAULT CURRENT_DATE,
  culto TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'membro_em_potencial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_visitantes_telefone ON public.visitantes (telefone);
CREATE INDEX idx_visitantes_data_visita ON public.visitantes (data_visita DESC);

-- Enable RLS
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

-- Public can insert (for the /sou-novo form)
CREATE POLICY "Anyone can register as visitor"
ON public.visitantes
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update/delete
CREATE POLICY "Admins can manage visitantes"
ON public.visitantes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to notify admins on new visitor
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_visitor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT p.id as profile_id
    FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO notificacoes (
      voluntario_id,
      tipo,
      titulo,
      mensagem
    )
    VALUES (
      admin_record.profile_id,
      'sistema',
      'Novo visitante registrado',
      NEW.nome || ' visitou a igreja hoje.'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger for new visitor notification
CREATE TRIGGER on_new_visitor_notify_admins
AFTER INSERT ON public.visitantes
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_visitor();