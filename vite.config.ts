import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("official-pages.json")) return "official-content";
          if (id.includes("products.json")) return "catalog-data";
          if (id.includes("node_modules/react")) return "react-core";
          if (id.includes("@phosphor-icons")) return "icons";
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
