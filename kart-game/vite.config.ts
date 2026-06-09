import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/kart/",
  build: {
    outDir: resolve(__dirname, "../public/kart"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
