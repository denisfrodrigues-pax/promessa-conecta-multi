-- Contas financeiras (caixa, conta bancária, pix)
CREATE TABLE IF NOT EXISTS contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL, -- 'caixa' | 'banco' | 'pix'
  descricao text,
  saldo numeric(14,2) DEFAULT 0.00,
  moeda text DEFAULT 'BRL',
  status text DEFAULT 'ativa', -- 'ativa' | 'inativa'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categorias financeiras (receita/despesa)
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  natureza text NOT NULL, -- 'receita' | 'despesa'
  descricao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid REFERENCES contas_financeiras(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  tipo text NOT NULL, -- 'receita'|'despesa'
  valor numeric(14,2) NOT NULL,
  descricao text,
  data_operacao date NOT NULL,
  referencia text,
  membro_id uuid REFERENCES membros(id) ON DELETE SET NULL,
  visitante_id uuid REFERENCES visitantes(id) ON DELETE SET NULL,
  evento_id uuid REFERENCES eventos(id) ON DELETE SET NULL,
  criado_por uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'confirmado', -- 'confirmado'|'pendente'|'cancelado'
  nota text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auditoria financeira
CREATE TABLE IF NOT EXISTS auditoria_financeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL, -- 'create' 'update' 'delete'
  payload jsonb,
  usuario_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_financeira ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contas_financeiras
CREATE POLICY "Admins can manage contas_financeiras" ON contas_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view contas_financeiras" ON contas_financeiras
  FOR SELECT USING (true);

-- RLS Policies for categorias_financeiras
CREATE POLICY "Admins can manage categorias_financeiras" ON categorias_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view categorias_financeiras" ON categorias_financeiras
  FOR SELECT USING (true);

-- RLS Policies for transacoes_financeiras
CREATE POLICY "Admins can manage transacoes_financeiras" ON transacoes_financeiras
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view transacoes_financeiras" ON transacoes_financeiras
  FOR SELECT USING (true);

-- RLS Policies for auditoria_financeira
CREATE POLICY "Admins can view auditoria_financeira" ON auditoria_financeira
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert auditoria" ON auditoria_financeira
  FOR INSERT WITH CHECK (true);

-- Function to recalculate account balance
CREATE OR REPLACE FUNCTION recalcula_saldo_conta(p_conta_id uuid) 
RETURNS numeric 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_saldo numeric := 0;
BEGIN
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
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_contas_financeiras_updated_at
  BEFORE UPDATE ON contas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_financeiras_updated_at
  BEFORE UPDATE ON transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categorias_financeiras (nome, natureza, descricao) VALUES
  ('Dízimo', 'receita', 'Dízimos dos membros'),
  ('Oferta', 'receita', 'Ofertas gerais'),
  ('Doação', 'receita', 'Doações específicas'),
  ('Campanha', 'receita', 'Arrecadação de campanhas'),
  ('Evento', 'receita', 'Receitas de eventos'),
  ('Aluguel', 'despesa', 'Despesas com aluguel'),
  ('Energia', 'despesa', 'Conta de luz'),
  ('Água', 'despesa', 'Conta de água'),
  ('Internet', 'despesa', 'Serviços de internet'),
  ('Material', 'despesa', 'Materiais diversos'),
  ('Manutenção', 'despesa', 'Manutenção predial'),
  ('Salários', 'despesa', 'Folha de pagamento'),
  ('Missões', 'despesa', 'Apoio missionário'),
  ('Ação Social', 'despesa', 'Projetos sociais'),
  ('Outros', 'receita', 'Outras receitas'),
  ('Outros', 'despesa', 'Outras despesas');