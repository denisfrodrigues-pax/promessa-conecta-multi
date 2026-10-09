import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VolunteerMinisterioLayout from './VolunteerMinisterioLayout';
import RequireVolunteerFuncaoPermissao from '@/components/routes/RequireVolunteerFuncaoPermissao';

// Reproduz o bug de verdade: minhasPermissoes começa em [] (estado inicial,
// não "carregando") e só é preenchido quando a RPC get_my_funcao_permissoes
// resolve, de forma assíncrona. Sem o fix, RequireVolunteerFuncaoPermissao lê
// esse [] inicial e já redireciona antes da resposta chegar — entrar direto
// em /volunteer/mca/checkin (link, F5, reload do quiosque) sempre voltava pro
// painel, mesmo com a permissão.

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (fn: string, args: unknown) => rpcMock(fn, args), from: vi.fn() },
}));
vi.mock('@/contexts/IgrejaSlugContext', () => ({
  useIgrejaSlug: () => ({ p: (path: string) => path }),
}));
// Referências estáveis (fora do mock) de propósito: VolunteerMinisterioLayout
// tem um useEffect com myMinistries nas dependências — um array recriado a
// cada chamada de useAuth() (como o contexto real, via useContext, NUNCA
// faz) dispararia o efeito, setMinisterio(objeto novo), re-render, useAuth()
// de novo, novo array... loop infinito de render só por causa do mock, sem
// nenhuma relação com o bug real sendo testado aqui.
const USER = { id: 'user-1' };
const PROFILE = { nome: 'Marcelo' };
const ROLES = ['voluntario'];
const MY_MINISTRIES = [{ ministerio_id: 'm1', nome: 'Kids', slug: 'mca', papel: 'voluntario' }];

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: USER,
    loading: false,
    profile: PROFILE,
    isVoluntario: true,
    roles: ROLES,
    myMinistries: MY_MINISTRIES,
    myMinistriesLoading: false,
  }),
}));

function delayedRpc(result: { data: string[] | null; error: { message: string } | null }, ms: number) {
  rpcMock.mockReturnValue(new Promise((resolve) => setTimeout(() => resolve(result), ms)));
}

function renderCheckinRoute() {
  return render(
    <MemoryRouter initialEntries={['/volunteer/mca/checkin']}>
      <Routes>
        <Route path="/volunteer/:slug" element={<VolunteerMinisterioLayout />}>
          <Route index element={<div>Painel do voluntário</div>} />
          <Route element={<RequireVolunteerFuncaoPermissao permission="mca.checkin.qualquer_sala" />}>
            <Route path="checkin" element={<div>Tela de Check-in</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('VolunteerMinisterioLayout + RequireVolunteerFuncaoPermissao — corrida da RPC de permissões', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('com a permissão: mostra loading enquanto a RPC não resolve, depois a tela de check-in (NÃO redireciona)', async () => {
    delayedRpc({ data: ['mca.checkin.qualquer_sala'], error: null }, 50);
    renderCheckinRoute();

    // No meio do caminho, antes da RPC resolver: nem a tela nem o painel (redirect) apareceram ainda.
    expect(screen.queryByText('Tela de Check-in')).not.toBeInTheDocument();
    expect(screen.queryByText('Painel do voluntário')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Tela de Check-in')).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.queryByText('Painel do voluntário')).not.toBeInTheDocument();
  });

  it('sem a permissão (Professor): mostra loading, só redireciona depois da RPC resolver', async () => {
    delayedRpc({ data: ['mca.professor.gerenciar_sala'], error: null }, 50);
    renderCheckinRoute();

    expect(screen.queryByText('Painel do voluntário')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Painel do voluntário')).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.queryByText('Tela de Check-in')).not.toBeInTheDocument();
  });

  it('RPC com erro: não trava — termina o loading e redireciona (fail-safe)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    delayedRpc({ data: null, error: { message: 'boom' } }, 50);
    renderCheckinRoute();

    await waitFor(() => expect(screen.getByText('Painel do voluntário')).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.queryByText('Tela de Check-in')).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
