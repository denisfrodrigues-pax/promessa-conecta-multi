-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('nova_escala', 'lembrete', 'status_alterado');

-- Create notifications table
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voluntario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  escala_id UUID REFERENCES public.escalas(id) ON DELETE CASCADE,
  tipo notification_type NOT NULL,
  mensagem TEXT NOT NULL,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin full access
CREATE POLICY "Admins can manage all notifications"
ON public.notificacoes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Leaders can view notifications of their ministry volunteers
CREATE POLICY "Leaders can view ministry volunteers notifications"
ON public.notificacoes
FOR SELECT
USING (
  has_role(auth.uid(), 'lider') AND
  voluntario_id IN (
    SELECT mv.user_id FROM ministerio_voluntarios mv
    JOIN ministerios m ON mv.ministerio_id = m.id
    WHERE m.lider_id = get_profile_id(auth.uid())
  )
);

-- Members can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notificacoes
FOR SELECT
USING (voluntario_id = get_profile_id(auth.uid()));

-- Members can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notificacoes
FOR UPDATE
USING (voluntario_id = get_profile_id(auth.uid()));

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notificacoes
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notificacoes_updated_at
BEFORE UPDATE ON public.notificacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_notificacoes_voluntario_id ON public.notificacoes(voluntario_id);
CREATE INDEX idx_notificacoes_escala_id ON public.notificacoes(escala_id);
CREATE INDEX idx_notificacoes_lido ON public.notificacoes(lido);
CREATE INDEX idx_notificacoes_tipo ON public.notificacoes(tipo);