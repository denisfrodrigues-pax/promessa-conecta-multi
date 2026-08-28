import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Aviso discreto de "nova versão disponível" para o service worker do PWA.
 *
 * registerType: "prompt" (vite.config.ts) deixa uma nova versão instalada mas
 * "esperando" até alguém pedir a troca — nunca troca sozinho. Sem esta UI,
 * quem já tinha o app aberto/instalado ficava preso indefinidamente numa
 * versão antiga do bundle, sem nenhum jeito de saber ou de atualizar (raiz de
 * bugs "fantasma" que já foram corrigidos no código mas continuam
 * reaparecendo pra quem está com cache antigo).
 *
 * Só atualiza quando o usuário clica — nunca recarrega sozinho (a versão
 * anterior forçava reload automático do SW e isso incomodava, ver histórico
 * de main.tsx).
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 leading-tight">
            Nova versão disponível
          </p>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
            Atualize para ver as últimas mudanças
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" onClick={handleUpdate} className="h-8 text-xs px-3">
            Atualizar
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
