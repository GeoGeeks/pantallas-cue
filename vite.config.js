import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxySecure = env.VITE_API_PROXY_SECURE !== "false";

  return {
    plugins: [react()],
    base: "/pantallas-cue/",
    server: {
      proxy: {
        "/api/agenda": {
          target: env.VITE_API_PROXY_TARGET || "https://geoapps.esri.co",
          changeOrigin: true,
          secure: proxySecure,
          rewrite: (path) =>
            path.replace(
              /^\/api\/agenda/,
              env.VITE_API_PROXY_PATH || "/agenda-cue-2026/rest/v1/ecuador",
            ),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const existingAuth = proxyReq.getHeader("Authorization");
              if (existingAuth) {
                return;
              }

              const token = env.VITE_API_TOKEN || env.VITE_AUTH_TOKEN || "";
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
