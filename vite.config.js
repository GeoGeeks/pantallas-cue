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
        /* Conectado 2026-09-22 al backend real de Colombia
           (appmovilapi.esri.co, NestJS + SQL Server — el mismo que usa el
           panel de administración de CUE_CO). Verificado en vivo con `curl`:
           las rutas que este proxy reenvía (`/admin/eventos/{id}/charlas`,
           `/laboratorios`, y `/api/catalogos-agenda` / `/api/franjas-
           horarias` si algún día se consumen) responden 200 SIN
           Authorization — ver el aviso completo en `agendaApi.js` sobre por
           qué están abiertas y qué pasa si el backend cierra ese hueco.

           🔴 Por eso ya NO se inyecta ningún Bearer por defecto: el token de
           `.env` era el de PANAMÁ (`pais: panama`), inútil contra este
           backend, y mandarlo no aporta nada. Si el equipo de backend pide
           más adelante un token de servicio para estas rutas, se reintroduce
           aquí — el mecanismo ya no vive en este archivo, hay que reponerlo. */
        [apiProxyPath]: {
          target: env.VITE_API_PROXY_TARGET || "https://appmovilapi.esri.co",
          changeOrigin: true,
          secure: proxySecure,
          rewrite: (path) =>
            path.replace(apiProxyPattern, env.VITE_API_PROXY_PATH || "/api"),
        },
      },
    },
  };
});
