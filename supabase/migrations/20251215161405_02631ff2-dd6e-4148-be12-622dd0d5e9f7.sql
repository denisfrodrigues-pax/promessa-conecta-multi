-- Fix: Add authorization check to recalcula_saldo_conta function
-- This prevents unauthorized users from recalculating account balances

CREATE OR REPLACE FUNCTION public.recalcula_saldo_conta(p_conta_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  novo_saldo numeric := 0;
BEGIN
  -- Authorization check: Only admin or financeiro roles can execute this function
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin or financeiro roles can recalculate account balances';
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'receita' THEN valor ELSE -valor END
  ), 0) INTO novo_saldo
  FROM transacoes_financeiras
  WHERE conta_id = p_conta_id AND status = 'confirmado';
  
  UPDATE contas_financeiras 
  SET saldo = novo_saldo, updated_at = now() 
  WHERE id = p_conta_id;
  
  RETURN novo_saldo;
END;
$function$;