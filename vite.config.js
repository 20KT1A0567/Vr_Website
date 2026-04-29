import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, ".", "");
    return {
        plugins: [react()],
        resolve: {
            alias: {
                api: "/src/api",
                components: "/src/components",
                pages: "/src/pages",
                store: "/src/store",
                styles: "/src/styles",
                types: "/src/types"
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
