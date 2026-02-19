
-- Tabela de módulos disponíveis por ministério
CREATE TABLE public.ministerio_modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ministerio_id UUID NOT NULL REFERENCES public.ministerios(id) ON DELETE CASCADE,
  modulo_slug TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ministerio_id, modulo_slug)
);

-- RLS
ALTER TABLE public.ministerio_modulos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver módulos ativos (necessário para renderização de menu)
CREATE POLICY "Authenticated can view active modules"
ON public.ministerio_modulos
FOR SELECT
USING (ativo = true);

-- Admins gerenciam módulos
CREATE POLICY "Admins can manage modules"
ON public.ministerio_modulos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger de updated_at
CREATE TRIGGER update_ministerio_modulos_updated_at
BEFORE UPDATE ON public.ministerio_modulos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: módulo check-in para o ministério Kids (se existir)
INSERT INTO public.ministerio_modulos (ministerio_id, modulo_slug, nome, descricao, icone, ordem)
SELECT id, 'check-in', 'Check-in', 'Check-in de crianças', 'Baby', 0
FROM public.ministerios
WHERE slug = 'kids'
ON CONFLICT DO NOTHING;
