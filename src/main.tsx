import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/global-containers.css";

// ✅ Só ativa service worker em produção
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("[App] New service worker activated, reloading...");
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
);
