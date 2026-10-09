import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMcaCheckin, isVisitanteCheckin, checkinNome, type McaCheckinRow } from './useMcaCheckin';

const { insertSpy, fromMock } = vi.hoisted(() => ({
  insertSpy: vi.fn().mockResolvedValue({ error: null }),
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    channel: () => ({ on: vi.fn().mockReturnThis(), subscribe: (cb: (s: string) => void) => { cb('SUBSCRIBED'); return {}; } }),
    removeChannel: vi.fn(),
  },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'user-1' }, churchId: 'church-1' }) }));
vi.mock('@/contexts/IgrejaSlugContext', () => ({ useIgrejaSlug: () => ({ churchId: 'church-1' }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function selectChain(resolvedData: unknown) {
  const chain: Record<string, (...a: unknown[]) => unknown> = {};
  for (const m of ['select', 'eq', 'gte', 'lte', 'order']) chain[m] = vi.fn(() => chain);
  // o hook sempre faz await na query encadeada (sem terminal próprio) — o chain
  // precisa ser "thenable" pra resolver no último .order()/.eq() da cadeia.
  (chain as unknown as { then: (resolve: (v: unknown) => void) => void }).then = (resolve) =>
    resolve({ data: resolvedData, error: null });
  return chain;
}

function setupSupabase() {
  fromMock.mockImplementation((table: string) => {
    if (table === 'mca_salas') return selectChain([{ id: 'sala-1', nome: 'Berçário' }]);
    if (table === 'mca_criancas') return selectChain([{ id: 'crianca-1', nome: 'Ana', sala_id: 'sala-1', foto_url: null }]);
    if (table === 'mca_checkins') return { ...selectChain([]), insert: insertSpy };
    throw new Error('tabela inesperada: ' + table);
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('isVisitanteCheckin / checkinNome — crianca_id nulo (visitante)', () => {
  it('check-in sem crianca_id é reconhecido como visitante', () => {
    const ci = { id: '1', crianca_id: null, observacao: 'Visitante: Léo — Responsável: Ana' } as McaCheckinRow;
    expect(isVisitanteCheckin(ci)).toBe(true);
    expect(checkinNome(ci)).toBe('Léo');
  });

  it('check-in com crianca_id não é visitante e usa o nome da criança', () => {
    const ci = { id: '1', crianca_id: 'c1', mca_criancas: { nome: 'Ana' } } as McaCheckinRow;
    expect(isVisitanteCheckin(ci)).toBe(false);
    expect(checkinNome(ci)).toBe('Ana');
  });

  it('visitante sem nome capturável em observacao cai no genérico "Visitante"', () => {
    const ci = { id: '1', crianca_id: null, observacao: null } as McaCheckinRow;
    expect(checkinNome(ci)).toBe('Visitante');
  });
});

describe('useMcaCheckin — checkinMutation', () => {
  beforeEach(() => {
    insertSpy.mockClear();
    setupSupabase();
  });

  it('check-in de visitante grava crianca_id: null (não envia o campo com valor truthy)', async () => {
    const { result } = renderHook(() => useMcaCheckin('ministerio-1', '2026-10-09'), { wrapper });
    await waitFor(() => expect(result.current.salas.length).toBe(1));

    await act(async () => {
      await result.current.checkinMutation.mutateAsync({
        salaId: 'sala-1',
        visitante: { nome: 'Léo', responsavel: 'Ana' },
      });
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0];
    expect(payload.crianca_id).toBeNull();
    expect(payload.sala_id).toBe('sala-1');
    expect(payload.observacao).toBe('Visitante: Léo — Responsável: Ana');
  });

  it('check-in de criança cadastrada grava o crianca_id normalmente', async () => {
    const { result } = renderHook(() => useMcaCheckin('ministerio-1', '2026-10-09'), { wrapper });
    await waitFor(() => expect(result.current.salas.length).toBe(1));

    await act(async () => {
      await result.current.checkinMutation.mutateAsync({ salaId: 'sala-1', criancaId: 'crianca-1' });
    });

    const payload = insertSpy.mock.calls[0][0];
    expect(payload.crianca_id).toBe('crianca-1');
    expect(payload.observacao).toBeUndefined();
  });

  it('visitante sem nome ou responsável não chega a chamar insert', async () => {
    const { result } = renderHook(() => useMcaCheckin('ministerio-1', '2026-10-09'), { wrapper });
    await waitFor(() => expect(result.current.salas.length).toBe(1));

    await act(async () => {
      await expect(
        result.current.checkinMutation.mutateAsync({ salaId: 'sala-1', visitante: { nome: '', responsavel: 'Ana' } })
      ).rejects.toThrow();
    });
    expect(insertSpy).not.toHaveBeenCalled();
  });
});
