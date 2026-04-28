-- Insere a igreja base se a tabela estiver vazia.
-- igrejas.nome é a única coluna NOT NULL (slug não existe no schema).
INSERT INTO igrejas (nome, cidade, ativa)
SELECT 'Igreja da Promessa Hortolândia', 'Hortolândia', true
WHERE NOT EXISTS (SELECT 1 FROM igrejas);
