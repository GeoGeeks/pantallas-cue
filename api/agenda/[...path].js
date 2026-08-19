const API_TARGET = process.env.API_TARGET || "https://cue.esri.ec";
const API_PATH_PREFIX = process.env.API_PATH_PREFIX || "/rest/v1/ecuador";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const pathParts = Array.isArray(request.query.path)
    ? request.query.path
    : [request.query.path].filter(Boolean);
  const upstreamPath = pathParts.map((part) => encodeURIComponent(part)).join("/");
  const query = new URLSearchParams(request.query);
  query.delete("path");

  const upstreamUrl = new URL(
    `${API_PATH_PREFIX.replace(/\/$/, "")}/${upstreamPath}`,
    API_TARGET,
  );
  upstreamUrl.search = query.toString();

  const headers = {
    Accept: "application/json",
  };
  const token = (process.env.API_TOKEN || process.env.AUTH_TOKEN || "").trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers,
    });
    const body = await upstreamResponse.text();

    response.setHeader(
      "Content-Type",
      upstreamResponse.headers.get("content-type") || "application/json",
    );
    return response.status(upstreamResponse.status).send(body);
  } catch (error) {
    console.error("Agenda upstream request failed", error);
    return response.status(502).json({ error: "Upstream request failed" });
  }
}
