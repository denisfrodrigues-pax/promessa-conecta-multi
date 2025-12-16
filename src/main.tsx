import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "./styles/global-containers.css";

// Register service worker update handler
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    // Check for updates every 60 seconds
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  });

  // Listen for new service worker installation
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[App] New service worker activated, reloading...');
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
