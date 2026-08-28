import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/global-containers.css";

// O unregister incondicional de todo SW a cada carregamento (removido daqui)
// foi uma limpeza pontual de uma versão antiga do SW que forçava reload via
// skipWaiting()+clients.claim() (ver histórico de commits deste arquivo).
// Hoje isso está corrigido na origem (sw-push.js não força mais nada) e
// manter o unregister aqui impedia o próprio fluxo de atualização normal do
// SW: como toda carga desregistrava o service worker anterior, o navegador
// nunca chegava a manter uma versão nova "esperando" para comparar — o app
// nunca detectava que havia atualização disponível (ver PWAUpdatePrompt.tsx,
// que agora é o único canal — e só mediante clique do usuário — de update).

// Em produção, verifica atualizações do SW a cada 60s (sem forçar reload)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
);
