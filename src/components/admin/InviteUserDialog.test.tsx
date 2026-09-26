import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteUserDialog } from './InviteUserDialog';

const invoke = vi.fn();
let slugResult: { slug: string } | null = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: slugResult }) }) }) }),
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

async function convidar() {
  render(
    <InviteUserDialog open onOpenChange={() => {}} churchId="c1" defaultEmail="a@b.co" defaultNome="Fulano" />
  );
  fireEvent.click(screen.getByRole('button', { name: /enviar convite/i }));
  await waitFor(() => expect(invoke).toHaveBeenCalled());
  return invoke.mock.calls[0][1].body.redirectTo as string;
}

describe('InviteUserDialog redirectTo', () => {
  beforeEach(() => { invoke.mockReset(); invoke.mockResolvedValue({ data: {}, error: null }); });

  it('inclui o slug da igreja do convite (mesmo fora de /i/:slug, ex. superadmin)', async () => {
    slugResult = { slug: 'red' };
    expect(await convidar()).toBe(`${window.location.origin}/i/red/reset-password`);
  });

  it('usa o slug da igreja convidada, não o da URL atual', async () => {
    slugResult = { slug: 'convergencia' };
    expect(await convidar()).toBe(`${window.location.origin}/i/convergencia/reset-password`);
  });

  it('fallback p() (identidade fora de igreja) se a consulta do slug não retorna', async () => {
    slugResult = null;
    expect(await convidar()).toBe(`${window.location.origin}/reset-password`);
  });
});
