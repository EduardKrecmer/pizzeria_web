// Ďalšia Vite konfigurácia, ktorá povolí prístup z Replit domény
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Povoľujeme prístup z akejkoľvek Replit domény
    hmr: {
      clientPort: 443
    },
    // Povoľujeme všetkých hostiteľov (najmä pre Replit)
    cors: true
  }
});