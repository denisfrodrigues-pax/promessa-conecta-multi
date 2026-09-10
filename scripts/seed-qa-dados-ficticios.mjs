#!/usr/bin/env node
/**
 * Semeia dados fictícios (eventos, visitantes, transações financeiras, planos
 * de aula MCA/Ensino) nas 3 igrejas de demonstração, para permitir testar as
 * telas de detalhe que dependem de um registro real (ex: admin/visitantes/:id,
 * app/eventos/:id, leader/:slug/planos/:planoId) — essas tabelas não tinham
 * nenhum dado operacional semeado, só dados estruturais (ministérios, usuários,
 * bases).
 *
 * Idempotente: verifica se já existe um registro com o mesmo nome/título
 * marcado "(QA)" antes de inserir, então pode ser rodado mais de uma vez sem
 * duplicar.
 *
 * Requer as variáveis de ambiente VITE_SUPABASE_URL e
 * VITE_SUPABASE_PUBLISHABLE_KEY (já usadas pelo app, ver .env) e login válido
 * de admin de cada igreja de teste (autentica via REST, respeita RLS — não
 * usa a service role key).
 *
 * Uso: node scripts/seed-qa-dados-ficticios.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PASSWORD = process.env.QA_SEED_PASSWORD || 'Teste@2026';

const CHURCHES = [
  { name: 'convergencia', id: '64fe7026-bb76-4058-8768-b188e60831b4', email: 'marcos.vieira@igrejaconvergencia.com.br' },
  { name: 'radiacao', id: '4ee2b9a1-49e2-4300-b606-4616e9ffe0a0', email: 'eduardo.castro@igrejaradiacao.com.br' },
  { name: 'red', id: '0597321e-ac52-4234-a637-a18330f22dd7', email: 'paulo.barros@igrejared.com.br' },
];

async function login(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Login falhou para ${email}: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function rest(token, method, table, body, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) console.error('  ERRO', method, table, res.status, JSON.stringify(json));
  return { status: res.status, data: json };
}

async function ensureRows(token, table, existsQuery, rows) {
  const existing = (await rest(token, 'GET', table, null, existsQuery)).data;
  if (existing?.length) return existing.map(r => r.id);
  const ids = [];
  for (const row of rows) {
    const resp = await rest(token, 'POST', table, row);
    if (resp.data?.[0]) ids.push(resp.data[0].id);
  }
  return ids;
}

async function seedChurch(c) {
  console.log(`\n== ${c.name} ==`);
  const token = await login(c.email);

  const ministerios = (await rest(token, 'GET', 'ministerios', null, `church_id=eq.${c.id}&select=id,slug`)).data;
  const mcaId = ministerios.find(m => m.slug === 'mca')?.id;
  const ensinoId = ministerios.find(m => m.slug === 'ensino')?.id;

  // Eventos (3)
  const eventoIds = await ensureRows(token, 'eventos', `church_id=eq.${c.id}&titulo=ilike.*QA*&select=id`,
    ['Culto de Celebração QA', 'Retiro de Jovens QA', 'Conferência de Louvor QA'].map((titulo, i) => ({
      titulo, descricao: 'Evento fictício criado para auditoria de responsividade (QA).',
      data_inicio: new Date(2026, 9, 5 + i * 7, 19, 0).toISOString(), data_fim: null,
      local: 'Templo Sede', vagas: 100, church_id: c.id,
    })));
  console.log('  eventos:', eventoIds.length);

  // Visitantes (3) — status precisa bater com o CHECK constraint atual da tabela
  const visitanteIds = await ensureRows(token, 'visitantes', `church_id=eq.${c.id}&nome=ilike.*QA*&select=id`,
    [
      { nome: 'Bruna Almeida (QA)', status: 'novo' },
      { nome: 'Carlos Eduardo (QA)', status: 'contatado' },
      { nome: 'Fernanda Lima (QA)', status: 'membro_em_potencial' },
    ].map(v => ({ ...v, telefone: '11999990000', melhor_horario: 'Manhã', observacoes: 'Visitante fictício criado para auditoria (QA).', church_id: c.id })));
  console.log('  visitantes:', visitanteIds.length);

  // Conta financeira (1) + transações (3)
  const [contaId] = await ensureRows(token, 'contas_financeiras', `church_id=eq.${c.id}&nome=eq.Caixa QA&select=id`,
    [{ nome: 'Caixa QA', tipo: 'caixa', descricao: 'Conta fictícia criada para auditoria (QA).', status: 'ativa', church_id: c.id }]);
  console.log('  conta:', contaId);

  const categorias = (await rest(token, 'GET', 'categorias_financeiras', null, `church_id=eq.${c.id}&select=id,natureza`)).data;
  const catReceita = categorias.find(cat => cat.natureza === 'receita');
  let transacaoIds = [];
  if (contaId && catReceita) {
    transacaoIds = await ensureRows(token, 'transacoes_financeiras', `church_id=eq.${c.id}&descricao=ilike.*QA*&select=id`,
      [0, 1, 2].map(i => ({
        tipo: 'receita', conta_id: contaId, categoria_id: catReceita.id, valor: 100 + i * 50,
        data_operacao: new Date(2026, 8, 1 + i).toISOString().slice(0, 10),
        descricao: 'Lançamento fictício criado para auditoria (QA).', status: 'confirmado', church_id: c.id,
      })));
  }
  console.log('  transações:', transacaoIds.length);

  // Sala MCA (1, se o ministério existir) + planos (3)
  let planoMcaIds = [];
  if (mcaId) {
    const [salaId] = await ensureRows(token, 'mca_salas', `church_id=eq.${c.id}&nome=eq.Sala QA&select=id`,
      [{ nome: 'Sala QA', faixa_etaria_min: 4, faixa_etaria_max: 8, capacidade: 20, ativo: true, church_id: c.id, ministerio_id: mcaId }]);
    if (salaId) {
      planoMcaIds = await ensureRows(token, 'mca_planos_aula', `sala_id=eq.${salaId}&titulo=ilike.*QA*&select=id`,
        [0, 1, 2].map(i => ({ titulo: `Plano Kids QA ${i + 1}`, data_aula: new Date(2026, 8, 6 + i * 7).toISOString().slice(0, 10), sala_id: salaId })));
    }
  }
  console.log('  planos MCA:', planoMcaIds.length);

  // Turma Ensino (1, se o ministério existir) + planos (3)
  let planoEnsinoIds = [];
  if (ensinoId) {
    const [turmaId] = await ensureRows(token, 'ensino_turmas', `church_id=eq.${c.id}&nome=eq.Turma QA&select=id`,
      [{ nome: 'Turma QA', descricao: 'Turma fictícia criada para auditoria (QA).', ativo: true, church_id: c.id, ministerio_id: ensinoId }]);
    if (turmaId) {
      planoEnsinoIds = await ensureRows(token, 'ensino_planos_aula', `turma_id=eq.${turmaId}&titulo=ilike.*QA*&select=id`,
        [0, 1, 2].map(i => ({ titulo: `Plano Ensino QA ${i + 1}`, data_aula: new Date(2026, 8, 7 + i * 7).toISOString().slice(0, 10), turma_id: turmaId })));
    }
  }
  console.log('  planos Ensino:', planoEnsinoIds.length);

  return { church: c.name, eventoIds, visitanteIds, contaId, transacaoIds, planoMcaIds, planoEnsinoIds };
}

async function main() {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente antes de rodar.');
    process.exit(1);
  }
  const results = [];
  for (const c of CHURCHES) results.push(await seedChurch(c));
  console.log('\nConcluído:', JSON.stringify(results, null, 2));
}

main();
