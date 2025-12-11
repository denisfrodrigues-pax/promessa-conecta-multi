-- Fix: Change bases.lider_id to reference profiles.id instead of membros.id
-- This aligns with ministerios.lider_id which already references profiles.id

-- Drop existing foreign key constraint
ALTER TABLE public.bases DROP CONSTRAINT IF EXISTS bases_lider_id_fkey;

-- Add new foreign key constraint referencing profiles.id
ALTER TABLE public.bases 
ADD CONSTRAINT bases_lider_id_fkey 
FOREIGN KEY (lider_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bases_lider_id ON public.bases(lider_id);