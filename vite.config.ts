// O preset @lovable.dev/vite-tanstack-config já inclui plugins do TanStack Start.
// Não adicionar plugins duplicados manualmente — isso quebra o app.
// Configuração SPA: o Tauri precisa de HTML estático em frontendDist;
// o engine Python roda via IPC, não via SSR.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Desktop não usa SSR. O shell estático vira index.html
    // (arquivo que o Tauri espera em frontendDist).
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
        retryCount: 0,
      },
    },

    // Entrada de servidor mantida para builds web opcionais.
    server: { entry: "server" },
  },
});
