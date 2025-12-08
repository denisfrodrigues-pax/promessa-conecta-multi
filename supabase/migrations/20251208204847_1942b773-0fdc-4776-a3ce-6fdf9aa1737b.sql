-- Add ativo column to ministerios table
ALTER TABLE public.ministerios 
ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;