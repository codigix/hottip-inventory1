import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // adjust these if your repo layout is different
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  // point Vite to your client root
  root: path.resolve(process.cwd(), "client"),
  build: {
    // final build output
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
 server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
