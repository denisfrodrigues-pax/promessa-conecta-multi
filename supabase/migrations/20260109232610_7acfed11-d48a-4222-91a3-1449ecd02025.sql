-- Add new profile fields for extended personal information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS naturalidade text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS logradouro text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS uf text,
ADD COLUMN IF NOT EXISTS grau_instrucao text,
ADD COLUMN IF NOT EXISTS formacao text,
ADD COLUMN IF NOT EXISTS profissao text,
ADD COLUMN IF NOT EXISTS pcd text,
ADD COLUMN IF NOT EXISTS batizado_aguas boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_batismo date;

-- Add unique constraint for CPF (optional, can be null but must be unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL;