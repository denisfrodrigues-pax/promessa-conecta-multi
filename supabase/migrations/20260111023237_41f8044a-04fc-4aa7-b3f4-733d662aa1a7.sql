-- Adicionar campo user_id opcional na tabela membros para vincular com profiles
ALTER TABLE public.membros 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_membros_user_id ON public.membros(user_id);

-- Adicionar constraint de unicidade para evitar duplicatas (um usuário = um membro)
ALTER TABLE public.membros 
ADD CONSTRAINT membros_user_id_unique UNIQUE (user_id);

-- Comentário para documentação
COMMENT ON COLUMN public.membros.user_id IS 'Vínculo opcional com profile de usuário autenticado. NULL para membros sem conta no sistema.';