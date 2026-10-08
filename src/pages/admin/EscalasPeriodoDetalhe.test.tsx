import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminEscalasPeriodoDetalhe from './EscalasPeriodoDetalhe';

const { insertSpy, fromMock } = vi.hoisted(() => ({
  insertSpy: vi.fn().mockResolvedValue({ error: null }),
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null, churchId: 'church-1' }),
}));
vi.mock('@/contexts/IgrejaSlugContext', () => ({
  useIgrejaSlug: () => ({ churchId: 'church-1', p: (s: string) => s }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PERIODO = { id: 'periodo-1', nome: 'Outubro 2026', mes: 10, ano: 2026, status: 'aberto' };
const MINISTERIOS = [
  { id: 'm1', nome: 'Kids' },
  { id: 'm2', nome: 'Música' },
  { id: 'm3', nome: 'Mídia' },
];

// chain select()/eq()/in()/limit() -> this; termina em single() ou order(), que resolvem a promise.
function selectChain(resolvedData: unknown, terminal: 'single' | 'order') {
  const chain: Record<string, (...a: unknown[]) => unknown> = {};
  for (const m of ['select', 'eq', 'in', 'limit']) chain[m] = vi.fn(() => chain);
  chain[terminal] = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
  return chain;
}

// m3 (Mídia) já convocada para o evento — a única não selecionável nos testes abaixo,
// exceto no teste de "lista vazia" que convoca todas.
function setupFetch(eventoMinisterios: Array<{ id: string; ministerio_id: string; status: string; notificacao_enviada: boolean; ministerios: { nome: string } }>) {
  const evento = {
    id: 'evento-1', titulo: 'Culto de Domingo', tipo: 'culto', data_evento: '2026-10-11',
    horario_inicio: '19:00', horario_fim: '21:00', descricao: null, status: 'pendente',
    evento_ministerios: eventoMinisterios,
  };
  fromMock.mockImplementation((table: string) => {
    if (table === 'periodos_escala') return selectChain(PERIODO, 'single');
    if (table === 'eventos_escala') return selectChain([evento], 'order');
    if (table === 'ministerios') return selectChain(MINISTERIOS, 'order');
    if (table === 'evento_ministerios') return { insert: insertSpy };
    throw new Error('tabela inesperada no mock: ' + table);
  });
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/periodos/periodo-1']}>
        <Routes>
          <Route path="/periodos/:id" element={<AdminEscalasPeriodoDetalhe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function openConvocarDialog() {
  renderPage();
  await screen.findByText('Culto de Domingo');
  fireEvent.click(screen.getByRole('button', { name: /convocar/i }));
  await screen.findByText('Convocar ministérios — Culto de Domingo');
}

describe('EscalasPeriodoDetalhe — "Selecionar todos" no modal Convocar', () => {
  beforeEach(() => {
    insertSpy.mockClear();
  });

  it('marcar todos: seleciona os selecionáveis e mostra o contador certo', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    expect(screen.getByText('0 de 2 selecionados')).toBeInTheDocument();
    const selecionarTodos = screen.getByRole('checkbox', { name: /selecionar todos/i });
    expect(selecionarTodos).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(selecionarTodos);

    expect(screen.getByText('2 de 2 selecionados')).toBeInTheDocument();
    expect(selecionarTodos).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Kids' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Música' })).toBeChecked();
  });

  it('desmarcar todos: volta todos os selecionáveis a zero', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    const selecionarTodos = screen.getByRole('checkbox', { name: /selecionar todos/i });
    fireEvent.click(selecionarTodos); // marca todos
    fireEvent.click(selecionarTodos); // desmarca todos

    expect(screen.getByText('0 de 2 selecionados')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Kids' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Música' })).not.toBeChecked();
  });

  it('estado intermediário: só um marcado deixa "Selecionar todos" em mixed', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Kids' }));

    const selecionarTodos = screen.getByRole('checkbox', { name: /selecionar todos/i });
    expect(selecionarTodos).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByText('1 de 2 selecionados')).toBeInTheDocument();
  });

  it('marcar todos manualmente liga "Selecionar todos" sozinho', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Kids' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Música' }));

    const selecionarTodos = screen.getByRole('checkbox', { name: /selecionar todos/i });
    expect(selecionarTodos).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('2 de 2 selecionados')).toBeInTheDocument();
  });

  it('item já convocado (não selecionável) é ignorado por "Selecionar todos"', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    const midia = screen.getByRole('checkbox', { name: /mídia/i });
    expect(midia).toBeDisabled();
    expect(midia).toBeChecked(); // mostrado como já convocado, mas não entra na seleção enviada

    fireEvent.click(screen.getByRole('checkbox', { name: /selecionar todos/i }));

    // contador considera só os 2 selecionáveis, nunca os 3 ministérios totais
    expect(screen.getByText('2 de 2 selecionados')).toBeInTheDocument();
  });

  it('lista vazia (tudo já convocado): checkbox "Selecionar todos" fica desabilitado', async () => {
    setupFetch([
      { id: 'em1', ministerio_id: 'm1', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Kids' } },
      { id: 'em2', ministerio_id: 'm2', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Música' } },
      { id: 'em3', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } },
    ]);
    await openConvocarDialog();

    expect(screen.getByText('0 de 0 selecionados')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /selecionar todos/i })).toBeDisabled();
  });

  it('botão Convocar envia exatamente os ids selecionados via "Selecionar todos"', async () => {
    setupFetch([{ id: 'em1', ministerio_id: 'm3', status: 'pendente', notificacao_enviada: false, ministerios: { nome: 'Mídia' } }]);
    await openConvocarDialog();

    fireEvent.click(screen.getByRole('checkbox', { name: /selecionar todos/i }));

    const dialog = screen.getByText('Convocar ministérios — Culto de Domingo').closest('[role="dialog"]') as HTMLElement;
    fireEvent.click(within(dialog).getByRole('button', { name: /^Convocar/ }));

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    expect(insertSpy).toHaveBeenCalledWith([
      { evento_id: 'evento-1', ministerio_id: 'm1' },
      { evento_id: 'evento-1', ministerio_id: 'm2' },
    ]);
  });
});
