// @lovable.dev/vite-tanstack-config já inclui o seguinte — não adicionar manualmente
// plugins duplicados, pois isso quebra o app.
// A configuração abaixo mantém o TanStack Start em modo SPA para o desktop:
// o Tauri precisa de um documento HTML estático, enquanto o engine roda via IPC.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // O desktop não precisa de SSR. O shell estático vira index.html,
    // exatamente o arquivo que o Tauri espera encontrar em frontendDist.
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
        crawlLinks: false,
        retryCount: 0,
      },
    },

    // Mantém a entrada de servidor existente para o build web/Lovable.
    server: { entry: "server" },
  },
});
