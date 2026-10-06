import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIgrejaSlug } from '@/contexts/IgrejaSlugContext';
import { isIOS, isEmbeddedBrowser, isStandaloneDisplay } from '@/lib/pwaDetect';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_install_dismissed_until';
const DISMISS_DAYS = 7;

function iosDismissKey(slug: string): string {
  return `pwa_install_dismissed_ios_${slug}`;
}

export default function PWAInstallBanner() {
  const { slug, churchNome, churchLogoUrl } = useIgrejaSlug();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosVisible, setIosVisible] = useState(false);
  const [iosEmbedded, setIosEmbedded] = useState(false);

  // Android/desktop: beforeinstallprompt (comportamento existente, intocado).
  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Dismissed recently
    const until = localStorage.getItem(DISMISSED_KEY);
    if (until && Date.now() < Number(until)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // iOS: não existe beforeinstallprompt — a instrução de "Adicionar à Tela de
  // Início" precisa ser mostrada manualmente. Só roda com igreja resolvida
  // (PWAInstallBanner só monta dentro de /i/:slug, mas o guard de `slug` evita
  // qualquer corrida com o estado inicial do contexto).
  useEffect(() => {
    if (!slug) return;
    const ua = window.navigator.userAgent;
    if (!isIOS(ua, window.navigator.maxTouchPoints)) return;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = isStandaloneDisplay(nav.standalone, window.matchMedia('(display-mode: standalone)').matches);
    if (standalone) return;

    let dismissedUntil: string | null = null;
    try {
      dismissedUntil = localStorage.getItem(iosDismissKey(slug));
    } catch {
      // localStorage pode lançar no Safari em modo privado — segue sem persistência.
    }
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    setIosEmbedded(isEmbeddedBrowser(ua));
    setIosVisible(true);
  }, [slug]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setVisible(false);
  };

  const handleIosDismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(iosDismissKey(slug), String(until));
    } catch {
      // localStorage pode lançar no Safari em modo privado — fecha mesmo assim,
      // só não persiste entre sessões.
    }
    setIosVisible(false);
  };

  if (visible && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3">
          <img src={churchLogoUrl || '/pwa-192x192.png'} alt={churchNome || 'App'} className="w-10 h-10 rounded-xl shrink-0 object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 leading-tight">
              Instale o app{churchNome ? ` da ${churchNome}` : ''}
            </p>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Acesse mais rápido e receba notificações
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" onClick={handleInstall} className="h-8 text-xs px-3">
              <Download className="w-3.5 h-3.5 mr-1" />
              Instalar
            </Button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (iosVisible) {
    const texto = iosEmbedded
      ? 'Abra este link no Safari para instalar.'
      : `Para instalar o app${churchNome ? ` de ${churchNome}` : ''}: toque em Compartilhar e depois em Adicionar à Tela de Início.`;

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3">
          <Share className="w-5 h-5 shrink-0 text-gray-600" aria-hidden="true" />
          <p className="flex-1 min-w-0 text-[12.5px] font-medium text-gray-800 leading-tight">{texto}</p>
          <button
            onClick={handleIosDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
