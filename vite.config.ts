import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        api: "/src/api",
        components: "/src/components",
        lib: "/src/lib",
        pages: "/src/pages",
        store: "/src/store",
        styles: "/src/styles",
        types: "/src/types",
        utils: "/src/utils"
      }
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true
        }
      }
    }
  };
});
