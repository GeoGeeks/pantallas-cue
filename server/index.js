// Proxy standalone hacia la API de agenda (cue.esri.ec).
//
// Reemplaza a la antigua Vercel Function (api/agenda/[...path].js). Corre
// como un servicio de Windows independiente (gestionado con NSSM) escuchando
// solo en localhost; IIS lo expone hacia afuera mediante una regla de
// Application Request Routing (ARR) + URL Rewrite que reenvía
// /cue-2026-agenda/api/agenda/* hacia este proceso. Ver README.md.
//
// Variables de entorno (configurarlas en el servicio de NSSM, no hardcodear):
//   PORT              puerto local donde escucha (default 3001)
//   API_TARGET        host upstream (default https://cue.esri.ec)
//   API_PATH_PREFIX   prefijo de ruta upstream (default /rest/v1/ecuador)
//   API_TOKEN         bearer token para el upstream (o AUTH_TOKEN)

import express from "express";

const PORT = Number(process.env.PORT) || 3001;
const API_TARGET = process.env.API_TARGET || "https://cue.esri.ec";
const API_PATH_PREFIX = process.env.API_PATH_PREFIX || "/rest/v1/ecuador";
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
    console.warn(
      "API_TOKEN no configurado: las peticiones upstream saldrán sin Authorization.",
    );
  }
});
