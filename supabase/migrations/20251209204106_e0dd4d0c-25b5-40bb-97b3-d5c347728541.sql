-- Tabela membros
CREATE TABLE public.membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  data_nascimento date,
  endereco text,
  estado_civil text,
  data_batismo date,
  foto_perfil text,
  data_registro timestamptz DEFAULT now(),
  observacoes text,
  status text DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Trigger para updated_at
CREATE TRIGGER update_membros_updated_at
BEFORE UPDATE ON public.membros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas admin
CREATE POLICY "Admins can manage membros"
ON public.membros
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bucket para fotos de membros
INSERT INTO storage.buckets (id, name, public)
VALUES ('membros_fotos', 'membros_fotos', false);

-- Políticas de storage
CREATE POLICY "Authenticated users can upload member photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view member photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'membros_fotos');

CREATE POLICY "Admins can update member photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete member photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'membros_fotos' AND has_role(auth.uid(), 'admin'::app_role));