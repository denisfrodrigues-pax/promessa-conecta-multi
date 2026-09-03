import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      disable: process.env.NODE_ENV === 'development',
      registerType: "prompt",
      includeAssets: ["favicon.ico", "logo_placeholder.png"],
      manifest: {
        name: "Rede Conect - Sistema de Gestão Eclesiástica",
        short_name: "Rede Conect",
        description: "Sistema completo de gestão eclesiástica para organizar, acompanhar e crescer em comunidade.",
        theme_color: "#020F1E",
        background_color: "#020F1E",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        categories: ["productivity", "utilities"],
        screenshots: [],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Acessar o painel principal",
            url: "/home",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Minhas Escalas",
            short_name: "Escalas",
            description: "Ver minhas escalas",
            url: "/minhas-escalas",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        importScripts: ["/sw-push.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Sem isso, toda dependência compartilhada entre chunks lazy (praticamente
        // todas as páginas, via React/Router/Query/Radix) cai no chunk comum
        // carregado em toda navegação — daí o chunk principal de ~654 KB. Separar
        // por grupo estável de vendor reduz esse chunk sem tocar em nenhuma
        // página; libs pesadas usadas só em telas específicas (recharts, jspdf,
        // html2canvas) já são code-split automaticamente pelos imports lazy
        // existentes em App.tsx e não precisam de entrada aqui.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (
            /[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id) ||
            /[\\/]node_modules[\\/](lucide-react|class-variance-authority|clsx|tailwind-merge|sonner|cmdk|vaul|embla-carousel-react|react-day-picker|input-otp|react-resizable-panels)[\\/]/.test(id)
          ) {
            return "vendor-ui";
          }
          if (/[\\/]node_modules[\\/](@supabase|@tanstack|date-fns|zod)[\\/]/.test(id)) {
            return "vendor-data";
          }
        },
      },
    },
  },
}));
