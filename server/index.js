// Proxy standalone hacia la API de agenda.
//
// ⚠️ El destino real NO está aquí: lo fijan las variables de entorno del
// servicio NSSM, y los valores de abajo son solo los POR DEFECTO — hay que
// reconfigurar el servicio en el servidor para que apunten aquí de verdad.
//
// Conectado 2026-09-22 al backend real de Colombia (appmovilapi.esri.co,
// NestJS + SQL Server — el mismo que usa el panel de administración de
// CUE_CO). Verificado en vivo con `curl`: `/api/admin/eventos/{id}/charlas`
// y `/laboratorios` responden 200 SIN Authorization — son las rutas ADMIN,
// abiertas hoy por un hueco de seguridad ya documentado en el panel
// (`EntraIdGuard` sin aplicar ahí), no una decisión a propósito del backend.
// Si el equipo de backend lo cierra, esto empieza a dar 401 sin aviso — ver
// el pendiente en README.md.
//
// Reemplaza a la antigua Vercel Function (api/agenda/[...path].js). Corre
// como un servicio de Windows independiente (gestionado con NSSM) escuchando
// solo en localhost; IIS lo expone hacia afuera mediante una regla de
// Application Request Routing (ARR) + URL Rewrite que reenvía
// /cue-2026-agenda/api/agenda/* hacia este proceso. Ver README.md.
//
// Variables de entorno (configurarlas en el servicio de NSSM, no hardcodear):
//   PORT              puerto local donde escucha (default 3001)
//   API_TARGET        host upstream (default https://appmovilapi.esri.co)
//   API_PATH_PREFIX   prefijo de ruta upstream (default /api)
//   API_TOKEN         bearer token para el upstream (o AUTH_TOKEN) — hoy no
//                      hace falta ninguno; se deja por si el backend pide
//                      más adelante un token de servicio para estas rutas.

import express from "express";

const PORT = Number(process.env.PORT) || 3001;
const API_TARGET = process.env.API_TARGET || "https://appmovilapi.esri.co";
const API_PATH_PREFIX = process.env.API_PATH_PREFIX || "/api";
const API_TOKEN = (process.env.API_TOKEN || process.env.AUTH_TOKEN || "").trim();

const app = express();
app.disable("x-powered-by");

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/agenda/*path", async (req, res) => {
  const pathParts = Array.isArray(req.params.path)
    ? req.params.path
    : [req.params.path].filter(Boolean);
  const upstreamPath = pathParts.map((part) => encodeURIComponent(part)).join("/");

  const query = new URLSearchParams(req.query);
  const upstreamUrl = new URL(
    `${API_PATH_PREFIX.replace(/\/$/, "")}/${upstreamPath}`,
    API_TARGET,
  );
  upstreamUrl.search = query.toString();

  const headers = { Accept: "application/json" };
  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers,
    });
    const body = await upstreamResponse.text();

    res
      .status(upstreamResponse.status)
      .type(upstreamResponse.headers.get("content-type") || "application/json")
      .send(body);
  } catch (error) {
    console.error("Agenda upstream request failed", error);
    res.status(502).json({ error: "Upstream request failed" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Solo localhost: IIS/ARR en la misma máquina es el único llamador esperado.
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Agenda proxy escuchando en http://127.0.0.1:${PORT}`);
  if (!API_TOKEN) {
    console.log(
      "API_TOKEN no configurado: las peticiones upstream salen sin Authorization (esperado contra appmovilapi.esri.co/admin — ver comentario arriba).",
    );
  }
});
