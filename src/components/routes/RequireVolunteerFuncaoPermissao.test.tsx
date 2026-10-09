import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import RequireVolunteerFuncaoPermissao from './RequireVolunteerFuncaoPermissao';

vi.mock('@/contexts/IgrejaSlugContext', () => ({
  useIgrejaSlug: () => ({ p: (path: string) => path }),
}));

function Wrapper({ minhasPermissoes }: { minhasPermissoes: string[] }) {
  return <Outlet context={{ ministerioId: 'm1', ministerioNome: 'Kids', papel: 'voluntario', minhasPermissoes }} />;
}

function renderComPermissoes(minhasPermissoes: string[]) {
  return render(
    <MemoryRouter initialEntries={['/volunteer/mca/checkin']}>
      <Routes>
        <Route path="/volunteer/:slug" element={<Wrapper minhasPermissoes={minhasPermissoes} />}>
          <Route index element={<div>Painel do voluntário</div>} />
          <Route element={<RequireVolunteerFuncaoPermissao permission="mca.checkin.qualquer_sala" />}>
            <Route path="checkin" element={<div>Tela de Check-in</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireVolunteerFuncaoPermissao', () => {
  it('voluntário COM a função "Responsável pelo Check-in" (mca.checkin.qualquer_sala) acessa a tela', () => {
    renderComPermissoes(['mca.checkin.qualquer_sala']);
    expect(screen.getByText('Tela de Check-in')).toBeInTheDocument();
  });

  it('voluntário SEM nenhuma função volta pro painel do voluntário', () => {
    renderComPermissoes([]);
    expect(screen.queryByText('Tela de Check-in')).not.toBeInTheDocument();
    expect(screen.getByText('Painel do voluntário')).toBeInTheDocument();
  });

  it('Professor(a) (só mca.professor.gerenciar_sala, sem check-in) NÃO acessa — volta pro painel', () => {
    renderComPermissoes(['mca.professor.gerenciar_sala']);
    expect(screen.queryByText('Tela de Check-in')).not.toBeInTheDocument();
    expect(screen.getByText('Painel do voluntário')).toBeInTheDocument();
  });

  it('Auxiliar (mesma permissão do Responsável) também acessa', () => {
    renderComPermissoes(['mca.checkin.qualquer_sala']);
    expect(screen.getByText('Tela de Check-in')).toBeInTheDocument();
  });
});
