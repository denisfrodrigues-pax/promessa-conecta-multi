import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { IgrejaSlugLayout } from './IgrejaSlugContext';

// IgrejaSlugLayout puxa Outlet/useParams do react-router, dados da igreja via
// useIgrejaBySlug (Supabase) e papéis via useAuth — nenhum dos três é o que
// este teste cobre (troca do apple-touch-icon), então todos são mockados.
let mockChurch: {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
} | null = null;

vi.mock('react-router-dom', () => ({
  useParams: () => ({ churchSlug: mockChurch?.slug ?? 'red' }),
  Outlet: () => null,
}));

vi.mock('@/hooks/useIgrejaBySlug', () => ({
  useIgrejaBySlug: () => ({ church: mockChurch, loading: false }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ roles: [], churchId: null, setChurchIdOverride: vi.fn() }),
}));

vi.mock('@/components/PWAInstallBanner', () => ({ default: () => null }));

function setHeadLikeIndexHtml() {
  document.head.innerHTML = `
    <link rel="apple-touch-icon" href="/pwa-192x192.png" />
    <meta name="apple-mobile-web-app-title" content="Rede Conect" />
    <link rel="manifest" href="/manifest.webmanifest" />
  `;
}

function appleIconHref(): string | null {
  return document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ?? null;
}

describe('IgrejaSlugLayout — apple-touch-icon', () => {
  beforeEach(() => {
    setHeadLikeIndexHtml();
  });

  it('troca o apple-touch-icon quando a igreja tem logo_url', async () => {
    mockChurch = { id: '1', nome: 'Igreja Red', slug: 'red', logo_url: 'data:image/svg+xml;base64,AAA', cor_primaria: '#E4002B', cor_secundaria: null };
    render(<IgrejaSlugLayout />);
    await waitFor(() => expect(appleIconHref()).toBe('/api/manifest-icon/red?size=180&purpose=apple'));
  });

  it('também troca o apple-touch-icon quando a igreja NÃO tem logo_url (endpoint cai no genérico sozinho)', async () => {
    mockChurch = { id: '2', nome: 'Igreja Sem Logo', slug: 'sem-logo', logo_url: null, cor_primaria: '#2D6A4F', cor_secundaria: null };
    render(<IgrejaSlugLayout />);
    await waitFor(() => expect(appleIconHref()).toBe('/api/manifest-icon/sem-logo?size=180&purpose=apple'));
  });
});
