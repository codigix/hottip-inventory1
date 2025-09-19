import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,          // 👈 Vite dev server runs here
    strictPort: true,    // fail if port already in use
    hmr: {
      host: "localhost", // 👈 force WebSocket host
      port: 5173,        // 👈 force WebSocket port
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
