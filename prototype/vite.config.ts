import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: "ui",
  publicDir: false,
  resolve: {
    alias: {
      "@": resolve(__dirname, "./ui"),
    },
  },
  build: {
    outDir: resolve(__dirname, "./src/dashboard/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000",
    },
  },
});
