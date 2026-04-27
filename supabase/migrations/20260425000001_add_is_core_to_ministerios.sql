-- Etapa 1: Adiciona is_core na tabela ministerios
-- Ministérios core não podem ser excluídos, apenas inativados.

-- 1. Adiciona coluna
ALTER TABLE ministerios
  ADD COLUMN IF NOT EXISTS is_core boolean NOT NULL DEFAULT false;

-- 2. Trigger que bloqueia DELETE em ministérios core
CREATE OR REPLACE FUNCTION prevent_core_ministerio_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_core = true THEN
    RAISE EXCEPTION 'Ministérios core não podem ser excluídos.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_core_ministerios ON ministerios;
CREATE TRIGGER trg_protect_core_ministerios
  BEFORE DELETE ON ministerios
  FOR EACH ROW EXECUTE FUNCTION prevent_core_ministerio_delete();
