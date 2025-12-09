-- Tabela bases
CREATE TABLE public.bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  lider_id uuid REFERENCES public.membros(id) ON DELETE SET NULL,
  data_criacao timestamptz DEFAULT now(),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela bases_membros
CREATE TABLE public.bases_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id uuid NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  data_entrada timestamptz DEFAULT now(),
  data_saida timestamptz,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'desligado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (base_id, membro_id, status)
);

-- Índice para garantir que membro só está em uma base ativa
CREATE UNIQUE INDEX idx_membro_base_ativa 
ON public.bases_membros (membro_id) 
WHERE status = 'ativo';

-- Triggers para updated_at
CREATE TRIGGER update_bases_updated_at
  BEFORE UPDATE ON public.bases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bases_membros_updated_at
  BEFORE UPDATE ON public.bases_membros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases_membros ENABLE ROW LEVEL SECURITY;

-- RLS policies for bases
CREATE POLICY "Admins can manage bases"
  ON public.bases FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active bases"
  ON public.bases FOR SELECT
  USING (status = 'ativo' OR has_role(auth.uid(), 'admin'));

-- RLS policies for bases_membros
CREATE POLICY "Admins can manage bases_membros"
  ON public.bases_membros FOR ALL
  USING (has_role(auth.uid(), 'admin'));