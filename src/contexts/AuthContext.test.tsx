import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import '../test/supabaseMock';
import { mockSupabase } from '../test/supabaseMock';
import { AuthProvider, useAuth } from './AuthContext';

// Helper component: reads context values and renders them as data-testid spans
function AuthInspector() {
  const ctx = useAuth();
  if (ctx.loading) return <span data-testid="loading">loading</span>;
  return (
    <div>
      <span data-testid="isAdmin">{String(ctx.isAdmin)}</span>
      <span data-testid="isLider">{String(ctx.isLider)}</span>
      <span data-testid="isVoluntario">{String(ctx.isVoluntario)}</span>
      <span data-testid="isFinanceiro">{String(ctx.isFinanceiro)}</span>
      <span data-testid="user">{ctx.user ? 'logged-in' : 'logged-out'}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthInspector />
    </AuthProvider>,
  );
}

describe('AuthContext — unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('shows logged-out state when no session', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('user').textContent).toBe('logged-out');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
  });
});

describe('AuthContext — role derivations', () => {
  function setupSignedInAs(roles: string[]) {
    const fakeUser = { id: 'user-1', email: 'test@test.com' };
    const fakeSession = { user: fakeUser };

    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: fakeSession } });
    mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('SIGNED_IN', fakeSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // profiles query
    mockSupabase._query.maybeSingle.mockResolvedValue({
      data: { id: 'p-1', user_id: 'user-1', nome: 'Test', email: 'test@test.com', status: 'ativo' },
      error: null,
    });

    // user_roles query — override the query chain to resolve with roles
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: roles.map((r) => ({ role: r })), error: null }),
        };
      }
      return mockSupabase._query;
    });

    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin role → isAdmin=true, isLider=true, isVoluntario=true, isFinanceiro=false', async () => {
    setupSignedInAs(['admin']);
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('isAdmin').textContent).toBe('true');
    expect(screen.getByTestId('isLider').textContent).toBe('true');
    expect(screen.getByTestId('isVoluntario').textContent).toBe('true');
    expect(screen.getByTestId('isFinanceiro').textContent).toBe('false');
  });

  it('lider role → isAdmin=false, isLider=true, isVoluntario=true', async () => {
    setupSignedInAs(['lider']);
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('isLider').textContent).toBe('true');
    expect(screen.getByTestId('isVoluntario').textContent).toBe('true');
  });

  it('membro role → all false', async () => {
    setupSignedInAs(['membro']);
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('isLider').textContent).toBe('false');
    expect(screen.getByTestId('isVoluntario').textContent).toBe('false');
    expect(screen.getByTestId('isFinanceiro').textContent).toBe('false');
  });

  it('financeiro role (without admin) → isFinanceiro=true, isAdmin=false', async () => {
    setupSignedInAs(['financeiro']);
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('isFinanceiro').textContent).toBe('true');
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
  });

  it('admin role overrides isFinanceiro → isFinanceiro=false even with financeiro role', async () => {
    setupSignedInAs(['admin', 'financeiro']);
    renderWithAuth();
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    expect(screen.getByTestId('isAdmin').textContent).toBe('true');
    expect(screen.getByTestId('isFinanceiro').textContent).toBe('false');
  });
});
