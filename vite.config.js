import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxySecure = env.VITE_API_PROXY_SECURE !== "false";

  return {
    plugins: [react()],
    // Sitio publicado como aplicación IIS bajo https://geoapps.esri.co/cue-2026-agenda/
    base: env.VITE_BASE_PATH || "/cue-2026-agenda/",
    server: {
      proxy: {
        "/api/agenda": {
          target: env.VITE_API_PROXY_TARGET || "https://cue.esri.ec",
          changeOrigin: true,
          secure: proxySecure,
          rewrite: (path) =>
            path.replace(
              /^\/api\/agenda/,
              env.VITE_API_PROXY_PATH || "/rest/v1/ecuador",
            ),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const existingAuth = proxyReq.getHeader("Authorization");
              if (existingAuth) {
                return;
              }

              const token = env.API_TOKEN || env.AUTH_TOKEN || "";
              if (token) {
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }
            });
          },
        },
      },
    },
  };
});
