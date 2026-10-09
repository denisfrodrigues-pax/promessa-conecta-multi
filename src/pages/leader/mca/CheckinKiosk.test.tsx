import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckinKiosk from './CheckinKiosk';

const signInMock = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { email: 'voluntario@teste.com' }, signIn: signInMock }),
}));
vi.mock('@/contexts/IgrejaSlugContext', () => ({
  useIgrejaSlug: () => ({ p: (path: string) => path }),
}));
vi.mock('@/hooks/useMcaCheckin', () => ({
  useMcaCheckin: () => ({
    salas: [], criancasDisponiveis: [], presentes: [],
    checkinMutation: { isPending: false, mutate: vi.fn() },
    checkoutMutation: { isPending: false, mutate: vi.fn() },
  }),
  todayStr: () => '2026-10-09',
}));

function renderKiosk(path: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/leader/:slug/checkin/quiosque" element={<CheckinKiosk />} />
          <Route path="/volunteer/:slug/checkin/quiosque" element={<CheckinKiosk />} />
          <Route path="/leader/:slug/checkin" element={<div>Checkin do líder</div>} />
          <Route path="/volunteer/:slug/checkin" element={<div>Checkin do voluntário</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CheckinKiosk — dica de saída no rodapé', () => {
  it('mostra o texto discreto explicando como sair do quiosque', () => {
    renderKiosk('/leader/mca/checkin/quiosque');
    expect(screen.getByText('Para sair, toque no cadeado e digite a senha.')).toBeInTheDocument();
  });

  it('o texto aparece igual quando montado pelo lado do voluntário', () => {
    renderKiosk('/volunteer/mca/checkin/quiosque');
    expect(screen.getByText('Para sair, toque no cadeado e digite a senha.')).toBeInTheDocument();
  });
});

describe('CheckinKiosk — sair do quiosque volta pra origem certa (líder x voluntário)', () => {
  async function sair() {
    fireEvent.click(screen.getByLabelText('Sair do modo quiosque'));
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
  }

  it('saindo do quiosque do líder volta pra /leader/mca/checkin', async () => {
    renderKiosk('/leader/mca/checkin/quiosque');
    await sair();
    await waitFor(() => expect(screen.getByText('Checkin do líder')).toBeInTheDocument());
  });

  it('saindo do quiosque do voluntário volta pra /volunteer/mca/checkin (não pro painel do líder)', async () => {
    renderKiosk('/volunteer/mca/checkin/quiosque');
    await sair();
    await waitFor(() => expect(screen.getByText('Checkin do voluntário')).toBeInTheDocument());
  });
});
