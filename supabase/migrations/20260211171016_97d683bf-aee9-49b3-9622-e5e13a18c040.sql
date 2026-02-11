
-- Remove duplicate bases_membros entries (keep the oldest)
DELETE FROM bases_membros WHERE id = '8ad17840-5742-49eb-b29e-0024199268e2';
DELETE FROM bases_membros WHERE id = '800202cd-4adc-4577-9396-05ed48980732';

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_bases_membros_unique_profile ON bases_membros (base_id, profile_id) WHERE profile_id IS NOT NULL AND status = 'ativo';
