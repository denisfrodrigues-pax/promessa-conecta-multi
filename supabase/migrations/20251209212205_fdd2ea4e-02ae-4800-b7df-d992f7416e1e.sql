-- Make membro_id nullable to allow visitor-only records
ALTER TABLE public.bases_membros 
ALTER COLUMN membro_id DROP NOT NULL;