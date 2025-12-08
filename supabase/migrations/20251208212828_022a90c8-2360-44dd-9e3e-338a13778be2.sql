-- Create ministerio_voluntarios table
CREATE TABLE public.ministerio_voluntarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ministerio_id, user_id)
);

-- Enable RLS
ALTER TABLE public.ministerio_voluntarios ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can manage ministerio_voluntarios"
ON public.ministerio_voluntarios
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Leaders: can manage volunteers of their ministries
CREATE POLICY "Leaders can manage their ministry volunteers"
ON public.ministerio_voluntarios
FOR ALL
USING (
  has_role(auth.uid(), 'lider') AND
  ministerio_id IN (
    SELECT id FROM public.ministerios WHERE lider_id = get_profile_id(auth.uid())
  )
);

-- Volunteers: can view their own records
CREATE POLICY "Users can view their own volunteer records"
ON public.ministerio_voluntarios
FOR SELECT
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_ministerio_voluntarios_updated_at
BEFORE UPDATE ON public.ministerio_voluntarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();