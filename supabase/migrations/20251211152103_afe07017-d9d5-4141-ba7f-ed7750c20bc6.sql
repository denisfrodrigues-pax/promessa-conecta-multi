-- Add missing columns to configuracoes_instituicao table
ALTER TABLE public.configuracoes_instituicao 
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS capacidade_base_padrao integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS bases_publicas boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS visitantes_auto boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS membros_editam_perfil boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_lideres boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notificacoes_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notificacoes_push boolean DEFAULT false;

-- Insert default record if not exists
INSERT INTO public.configuracoes_instituicao (id, nome_igreja)
SELECT gen_random_uuid(), 'Igreja da Promessa'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_instituicao LIMIT 1);