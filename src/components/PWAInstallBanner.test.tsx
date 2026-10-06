import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PWAInstallBanner from './PWAInstallBanner';
import { isIOS, isEmbeddedBrowser, isStandaloneDisplay } from '@/lib/pwaDetect';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
// iPadOS 13+ se anuncia como um Mac de verdade — só o maxTouchPoints distingue.
const IPADOS13_MACINTOSH =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const REAL_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPHONE_FACEBOOK = `${IPHONE_SAFARI} [FBAN/FBIOS;FBAV/450.0]`;
const IPHONE_INSTAGRAM = `${IPHONE_SAFARI} Instagram 300.0.0.0.0`;

describe('isIOS', () => {
  it('iPhone (Safari) → true', () => expect(isIOS(IPHONE_SAFARI, 5)).toBe(true));
  it('iPad (Safari, UA clássica) → true', () => expect(isIOS(IPAD_SAFARI, 5)).toBe(true));
  it('iPadOS 13+ anunciado como Macintosh, com touch → true', () => expect(isIOS(IPADOS13_MACINTOSH, 5)).toBe(true));
  it('Mac de verdade, sem touch → false', () => expect(isIOS(REAL_MAC, 0)).toBe(false));
  it('Android → false', () => expect(isIOS(ANDROID_CHROME, 5)).toBe(false));
  it('desktop Windows → false', () => expect(isIOS(WINDOWS_CHROME, 0)).toBe(false));
});

describe('isEmbeddedBrowser', () => {
  it('Facebook in-app (FBAN/FBAV) → true', () => expect(isEmbeddedBrowser(IPHONE_FACEBOOK)).toBe(true));
  it('Instagram in-app → true', () => expect(isEmbeddedBrowser(IPHONE_INSTAGRAM)).toBe(true));
  it('Safari normal → false (conservador)', () => expect(isEmbeddedBrowser(IPHONE_SAFARI)).toBe(false));
  it('userAgent desconhecido → false (conservador, na dúvida mostra instrução normal)', () =>
    expect(isEmbeddedBrowser('AlgumNavegadorNuncaVisto/1.0')).toBe(false));
});

describe('isStandaloneDisplay', () => {
  it('navigator.standalone true → true', () => expect(isStandaloneDisplay(true, false)).toBe(true));
  it('display-mode: standalone → true', () => expect(isStandaloneDisplay(undefined, true)).toBe(true));
  it('nenhum dos dois → false', () => expect(isStandaloneDisplay(false, false)).toBe(false));
});

// ---- Componente: fluxo iOS ----

vi.mock('@/contexts/IgrejaSlugContext', () => ({
  useIgrejaSlug: () => mockIgrejaSlug(),
}));

let mockIgrejaSlug = () => ({ slug: 'red', churchNome: 'Igreja Red', churchLogoUrl: null as string | null });

function stubNavigator(userAgent: string, { maxTouchPoints = 5, standalone }: { maxTouchPoints?: number; standalone?: boolean } = {}) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
  Object.defineProperty(window.navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true });
  if (standalone !== undefined) {
    Object.defineProperty(window.navigator, 'standalone', { value: standalone, configurable: true });
  } else {
    delete (window.navigator as Navigator & { standalone?: boolean }).standalone;
  }
}

function stubMatchMedia(standaloneMatches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('standalone') ? standaloneMatches : false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('<PWAInstallBanner /> — iOS', () => {
  beforeEach(() => {
    localStorage.clear();
    mockIgrejaSlug = () => ({ slug: 'red', churchNome: 'Igreja Red', churchLogoUrl: null });
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra a instrução de instalar com o nome da igreja no Safari do iPhone', () => {
    stubNavigator(IPHONE_SAFARI);
    render(<PWAInstallBanner />);
    expect(screen.getByText(/Para instalar o app de Igreja Red/)).toBeInTheDocument();
    expect(screen.getByText(/toque em Compartilhar/)).toBeInTheDocument();
  });

  it('mostra "abra no Safari" quando embutido no Instagram', () => {
    stubNavigator(IPHONE_INSTAGRAM);
    render(<PWAInstallBanner />);
    expect(screen.getByText('Abra este link no Safari para instalar.')).toBeInTheDocument();
    expect(screen.queryByText(/Compartilhar/)).not.toBeInTheDocument();
  });

  it('não mostra nada quando já instalado (navigator.standalone)', () => {
    stubNavigator(IPHONE_SAFARI, { standalone: true });
    render(<PWAInstallBanner />);
    expect(screen.queryByText(/Compartilhar/)).not.toBeInTheDocument();
  });

  it('não mostra nada quando já instalado (display-mode: standalone)', () => {
    stubNavigator(IPHONE_SAFARI);
    stubMatchMedia(true);
    render(<PWAInstallBanner />);
    expect(screen.queryByText(/Compartilhar/)).not.toBeInTheDocument();
  });

  it('não mostra nada no Android (fluxo iOS não interfere)', () => {
    stubNavigator(ANDROID_CHROME);
    render(<PWAInstallBanner />);
    expect(screen.queryByText(/Compartilhar/)).not.toBeInTheDocument();
  });

  it('dispensar persiste por igreja (localStorage) e some do ar', () => {
    stubNavigator(IPHONE_SAFARI);
    render(<PWAInstallBanner />);
    expect(screen.getByText(/Compartilhar/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(screen.queryByText(/Compartilhar/)).not.toBeInTheDocument();
    expect(localStorage.getItem('pwa_install_dismissed_ios_red')).toBeTruthy();
  });

  it('não mostra de novo numa igreja diferente mesmo com a anterior dispensada', () => {
    stubNavigator(IPHONE_SAFARI);
    const { unmount } = render(<PWAInstallBanner />);
    fireEvent.click(screen.getByLabelText('Fechar'));
    unmount();

    mockIgrejaSlug = () => ({ slug: 'convergencia', churchNome: 'Igreja Convergência', churchLogoUrl: null });
    render(<PWAInstallBanner />);
    expect(screen.getByText(/Para instalar o app de Igreja Convergência/)).toBeInTheDocument();
  });

  it('não quebra se localStorage lançar (modo privado do Safari)', () => {
    stubNavigator(IPHONE_SAFARI);
    // Só a chave de dispensa do iOS lança — o efeito Android (intocado, sem
    // try/catch) continua lendo a dele normalmente, sem interferir no teste.
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key.startsWith('pwa_install_dismissed_ios_')) throw new Error('private mode');
      return null;
    });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key.startsWith('pwa_install_dismissed_ios_')) throw new Error('private mode');
    });

    expect(() => render(<PWAInstallBanner />)).not.toThrow();
    expect(screen.getByText(/Compartilhar/)).toBeInTheDocument();
    expect(() => fireEvent.click(screen.getByLabelText('Fechar'))).not.toThrow();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
