import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxySecure = env.VITE_API_PROXY_SECURE !== "false";

  // Sitio publicado como aplicación IIS bajo https://geoapps.esri.co/cue-2026-agenda/
  const basePath = env.VITE_BASE_PATH || "/cue-2026-agenda/";

  // 🔴 La clave del proxy se DERIVA del base, no se escribe a mano. El cliente
  // pide `withBase("/api/agenda")` — es decir, CON el base delante—, así que
  // una clave fija "/api/agenda" no casa nunca y el dev server responde 404 a
  // la agenda. Eso no se ve como un fallo: `fetchAgendaData` trata el 404 como
  // "API caída" y cae al respaldo hardcodeado, así que en local se navega
  // sobre una agenda de ejemplo creyendo que es la real.
  const apiProxyPath = `${basePath}/api/agenda`.replace(/\/{2,}/g, "/");
  const apiProxyPattern = new RegExp(
    `^${apiProxyPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );

  return {
    plugins: [react()],
    base: basePath,
    server: {
      proxy: {
        [apiProxyPath]: {
          target: env.VITE_API_PROXY_TARGET || "https://cue.esri.pa",
          changeOrigin: true,
          secure: proxySecure,
          rewrite: (path) =>
            path.replace(
              apiProxyPattern,
              env.VITE_API_PROXY_PATH || "/rest/v1/panama",
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
