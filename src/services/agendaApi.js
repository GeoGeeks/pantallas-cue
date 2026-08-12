const API_BASE_URL = "/api/agenda";

const ENDPOINTS = {
  salones: "/charlas/",
  charlas: "/charlas/",
  laboratorios: "/laboratorios/",
};

const FALLBACK_AGENDA = {
  charlas: [
    {
      name: "Apertura de evento",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T12:00:00",
      location: "Salón K - Piso 3",
      sessionLevel: "Intermedio",
      topics: ["Trabajo en campo", "GeoAI"],
      esriProducts: ["GeoAI", "ArcGIS Pro"],
      targetAudiences: ["Nivel intermedio"],
      tipo_actividad: "Plenaria",
    },
    {
      name: "Mapas y análisis espacial",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T14:00:00",
      location: "Salón A",
      sessionLevel: "Básico",
      topics: ["Cartografía", "Analítica espacial"],
      esriProducts: ["ArcGIS Online"],
      targetAudiences: ["Público general"],
      tipo_actividad: "Charla técnica",
    },
    {
      name: "Tendencias de IA en GIS",
      description:
        "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Unde perferendis officiis magnam totam corrupti similique quas pariatur in, eaque nihil quia quae, soluta dolores voluptatibus amet autem sint quidem perspiciatis.",
      date: "2026-10-03",
      startTime: "2026-10-03T09:30:00",
      location: "Salón B",
      sessionLevel: "Avanzado",
      topics: ["IA", "Data science"],
      esriProducts: ["ArcGIS Pro"],
      targetAudiences: ["Profesionales"],
      tipo_actividad: "Plenaria",
    },
  ],
  salones: [
    {
      name: "Experiencias de innovación",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T10:30:00",
      location: "Salón A",
      sessionLevel: "Intermedio",
      topics: ["Innovación", "Trabajo en campo"],
      esriProducts: ["ArcGIS Pro"],
      targetAudiences: ["Nivel intermedio"],
      tipo_actividad: "Salón temático",
    },
  ],
  laboratorios: [
    {
      name: "Laboratorio de análisis espacial",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T11:00:00",
      location: "Laboratorio 1",
      sessionLevel: "Intermedio",
      topics: ["Laboratorio", "GeoAI"],
      esriProducts: ["ArcGIS Pro"],
      targetAudiences: ["Nivel intermedio"],
      tipo_actividad: "Laboratorios de entrenamiento",
    },
  ],
};

class AgendaApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = "AgendaApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class TokenError extends AgendaApiError {
  constructor(message, status, details) {
    super(message, "TOKEN_ERROR", status, details);
    this.name = "TokenError";
  }
}

class EndpointError extends AgendaApiError {
  constructor(message, status, details) {
    super(message, "ENDPOINT_ERROR", status, details);
    this.name = "EndpointError";
  }
}

class NetworkError extends AgendaApiError {
  constructor(message, details) {
    super(message, "NETWORK_ERROR", null, details);
    this.name = "NetworkError";
  }
}

function getToken() {
  return (
    import.meta.env.VITE_API_TOKEN ||
    import.meta.env.VITE_AUTH_TOKEN ||
    ""
  ).trim();
}

function normalizeDate(value) {
  if (!value) return "";

  const rawValue = String(value).trim();
  const isoDate = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoDate) {
    return `${isoDate[1]}/${isoDate[2]}/${isoDate[3]}`;
  }

  return rawValue;
}

function normalizeTime(value) {
  if (!value) return "";

  const rawValue = String(value).trim();
  const isoTime = rawValue.match(/(?:T|^)(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (isoTime) {
    let hours = parseInt(isoTime[1], 10);
    const minutes = isoTime[2];
    const period = hours >= 12 ? "p.m." : "a.m.";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
  }

  return rawValue;
}

function normalizeList(values) {
  if (Array.isArray(values)) {
    return values
      .map((value) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
          return (
            value.value || value.name || value.title || value.objective || ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof values === "string") {
    return [values];
  }

  return [];
}

function normalizeTopics(topics) {
  if (Array.isArray(topics)) {
    return topics
      .map((topic) => {
        if (typeof topic === "string") {
          return topic;
        }

        if (topic && typeof topic === "object") {
          return (
            topic.value ||
            topic.name ||
            topic.title ||
            topic.normalizedValue ||
            ""
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof topics === "string") {
    return [topics];
  }

  return [];
}

function resolveTipoActividad(item, fallback) {
  const rawValue = item.tipo_actividad || item.activityType || "";

  const value = String(rawValue).trim();

  const salonKeywords = ["Salón temático"];

  const charlaKeywords = ["Plenaria", "Actividad Social", "Charla técnica"];

  const laboratorioKeywords = ["Laboratorios de entrenamiento"];

  if (salonKeywords.includes(value)) {
    return "Salones temáticos";
  }

  if (charlaKeywords.includes(value)) {
    return "Charlas técnicas";
  }

  if (laboratorioKeywords.includes(value)) {
    return "Laboratorios de entrenamiento";
  }

  return "";
}

function normalizeItem(item, index, tipoActividad) {
  const nombre = item.name;
  const descripcion = item.description;
  const fecha = normalizeDate(item.date);
  const horaInicio = normalizeTime(item.startTime);
  const lugar = item.location;
  const nivel = item.sessionLevel;
  const tematicas = normalizeTopics(item.topics);
  const productos = normalizeList(item.esriProducts);
  const audiencias = normalizeList(item.targetAudiences);

  return {
    ...item,
    nombre,
    descripcion,
    hora_inicio: horaInicio,
    fecha,
    tipo_actividad: resolveTipoActividad(item, tipoActividad),
    lugar,
    tematicas,
    nivel,
    producto_esri: productos,
    audiencias,
  };
}

function extractItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [
    payload.data,
    payload.results,
    payload.items,
    payload.value,
    payload.response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(payload.charlas)) {
    return payload.charlas;
  }

  if (Array.isArray(payload.laboratorios)) {
    return payload.laboratorios;
  }

  return [];
}

function isAuthErrorStatus(status) {
  return [401, 403].includes(status);
}

function buildApiErrorMessage(status, errorBody) {
  if (status === 401) {
    return "Error de autenticación (401). Token inválido o expirado.";
  }

  if (status === 403) {
    return "Acceso denegado (403). Verifique el token y los permisos.";
  }

  if (status === 404) {
    return "Endpoint no encontrado (404). Verifique la URL del endpoint.";
  }

  if (status >= 500) {
    return "Error de servidor. Intente de nuevo más tarde.";
  }

  return (
    errorBody || `Error en el endpoint (${status}). Revise la URL del endpoint.`
  );
}

function getFallbackAgenda(espacio) {
  const fallback = FALLBACK_AGENDA[espacio] || FALLBACK_AGENDA.charlas;
  const tipoActividad =
    espacio === "laboratorios"
      ? "Laboratorios de entrenamiento"
      : espacio === "salones"
        ? "Salones temáticos"
        : "Charlas técnicas";

  return fallback.map((item, index) =>
    normalizeItem(item, index, tipoActividad),
  );
}

export async function fetchAgendaData(espacio) {
  const endpoint = ENDPOINTS[espacio] || ENDPOINTS.charlas;
  const token = getToken();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      mode: "cors",
    });
  } catch (error) {
    console.warn("API no disponible, usando agenda local de respaldo.", error);
    return getFallbackAgenda(espacio);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const message = buildApiErrorMessage(response.status, errorBody);

    if (isAuthErrorStatus(response.status)) {
      throw new TokenError(message, response.status, errorBody);
    }

    if (response.status >= 500) {
      console.warn(
        "API con error del servidor, usando agenda local de respaldo.",
        {
          espacio,
          status: response.status,
          response: errorBody,
        },
      );
      return getFallbackAgenda(espacio);
    }

    throw new EndpointError(message, response.status, errorBody);
  }

  const payload = await response.json();
  const rawItems = extractItems(payload);

  const tipoActividad =
    espacio === "laboratorios"
      ? "Laboratorios de entrenamiento"
      : espacio === "salones"
        ? "Salones temáticos"
        : "Charlas técnicas";

  return rawItems.map((item, index) =>
    normalizeItem(item, index, tipoActividad),
  );
}
