import { withBase } from "../config/agenda";

const API_BASE_URL = withBase("/api/agenda");

/**
 * ⚠️ `salones` apunta a `/charlas/` y no es un error: así se llama el endpoint
 * de la API. La sección se resuelve después, por el tipo de actividad
 * (`AGENDA_SECTIONS.salones.filtroTipo`), no por la URL.
 *
 * La clave `charlas` se retiró el 2026-09-01 con la sección de charlas técnicas
 * (Panamá no las tiene). Solo la usaban los dos valores por defecto de este
 * archivo, y ninguna ruta la pedía.
 */
const ENDPOINTS = {
  salones: "/charlas/",
  laboratorios: "/laboratorios/",
};

/**
 * Respaldo cableado de la agenda. ⚠️ Los lugares y las fechas son de EJEMPLO
 * («Salón A», «Laboratorio 1»): no existen en Panamá, y eso es lo único que
 * hoy delata en pantalla que estos datos no son reales.
 *
 * 🔴 NO rellenarlo con los salones y las fechas de verdad. Sería peor: dejaría
 * el respaldo indistinguible de la agenda real para quien mire el kiosco. Si
 * hace falta agenda de verdad sin backend, va por el proxy contra la API, no
 * por aquí.
 *
 * El bloque `charlas` (3 sesiones «Charla Técnica», con «Lorem ipsum» y «Salón
 * K - Piso 3») se retiró el 2026-09-01 junto con esa sección: sus items no
 * pasaban el filtro de ninguna de las dos secciones que quedan, así que la rama
 * que caía ahí solo podía producir una pantalla vacía.
 */
const FALLBACK_AGENDA = {
  salones: [
    {
      name: "Experiencias de innovación",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T10:30:00",
      endTime: "2026-10-02T11:30:00",
      location: "Salón A",
      sessionLevel: "Intermedio",
      topics: ["Innovación", "Trabajo en campo"],
      esriProducts: ["ArcGIS Pro"],
      targetAudiences: ["Nivel intermedio"],
      industry: ["Gobierno", "Servicios"],
      tipo_actividad: "Salón temático",
    },
  ],
  laboratorios: [
    {
      name: "Laboratorio de análisis espacial",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T11:00:00",
      endTime: "2026-10-02T12:30:00",
      location: "Laboratorio 1",
      sessionLevel: "Intermedio",
      topics: ["Laboratorio", "GeoAI"],
      esriProducts: ["ArcGIS Pro"],
      targetAudiences: ["Nivel intermedio"],
      industry: ["Tecnología", "Ciencia"],
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
  return String(rawValue).trim() || fallback || "";
}

function normalizeItem(item, tipoActividad) {
  const nombre = item.name;
  const descripcion = item.description;
  const fecha = normalizeDate(item.date);
  const horaInicio = normalizeTime(
    item.startTime || item.start_time || item.hora_inicio || item.timeStart,
  );
  const horaFin = normalizeTime(
    item.endTime ||
      item.end_time ||
      item.hora_fin ||
      item.finishTime ||
      item.timeEnd,
  );
  const lugar = item.location;
  const nivel = item.sessionLevel;
  const industria = normalizeList(
    item.industry || item.industries || item.industria,
  );
  const tematicas = normalizeTopics(item.topics);
  const productos = normalizeList(item.esriProducts);
  const audiencias = normalizeList(item.targetAudiences);
  const id =
    item.id ||
    [tipoActividad, nombre, fecha, horaInicio, horaFin, lugar]
      .map((value) => String(value || "").trim())
      .join("::");

  return {
    ...item,
    id,
    nombre,
    descripcion,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    fecha,
    tipo_actividad: resolveTipoActividad(item, tipoActividad),
    lugar,
    industria,
    tematicas,
    nivel,
    producto_esri: productos,
    audiencias,
  };
}

/**
 * Las charlas privadas (`visibility: "privada"`) son asignaciones que el panel
 * hace usuario por usuario: no son agenda pública y no deben verse en las
 * pantallas del evento. El backend ya las oculta a los asistentes, pero estas
 * pantallas consultan la API con un token de panel, que las recibe todas.
 *
 * Se descarta cualquier visibilidad declarada que no sea "publica", no solo
 * "privada": si el catálogo gana un valor nuevo, esto lo deja fuera en vez de
 * mostrarlo por omisión. Los items SIN el campo se conservan — los
 * laboratorios no tienen el concepto de visibilidad y se quedarían todos fuera.
 */
function isPublicItem(item) {
  const visibility = item?.visibility;
  if (!visibility) return true;
  return String(visibility).trim().toLowerCase() === "publica";
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
  const fallback = FALLBACK_AGENDA[espacio] || FALLBACK_AGENDA.salones;
  // 🔴 El respaldo se sirve SIN decir en pantalla que no son datos en vivo, y
  // eso es una DECISIÓN del dueño (2026-09-01), no un descuido: se prefiere que
  // el kiosco muestre algo antes que quedarse con un mensaje de error.
  //
  // El precio, medido ese mismo día: `geoapps.esri.co/cue-2026-agenda` estaba
  // respondiendo 401 «token expirado» y llevaba sirviendo esta agenda de
  // ejemplo —«Viernes 2 Octubre», «Experiencias de innovación», «Salón A»— como
  // si fuera la del evento. La única señal está en la consola del navegador.
  //
  // ⚠️ Se dispara en SEIS casos, y el último es el que más sorprende:
  //   error de red · 401 · 403 · 404 · ≥500 · y `rawItems.length === 0`.
  // O sea que un día sin sesiones —o el día siguiente al evento— no se ve
  // vacío: se ve con estas sesiones inventadas.
  //
  // ⚠️ Y el mensaje que `buildApiErrorMessage` ya redacta («Token inválido o
  // expirado», «Error de servidor») se descarta en esta rama. La maquinaria
  // para mostrarlo existe y funciona (`useAgenda` hace `setError`, y
  // `.estado-error` está en el CSS): lo único que falta es no llamar aquí.
  //
  // Si algún día se revisa, las dos salidas planteadas fueron: (a) usar el
  // respaldo solo en desarrollo y dejar que producción muestre el error real,
  // o (b) conservarlo con una banda visible de «datos de ejemplo».
  const tipoActividad =
    espacio === "laboratorios"
      ? "Laboratorios de entrenamiento"
      : "Salón temático";

  return fallback.map((item) => normalizeItem(item, tipoActividad));
}

export async function fetchAgendaData(espacio, options = {}) {
  const { signal } = options;
  const endpoint = ENDPOINTS[espacio] || ENDPOINTS.salones;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      mode: "cors",
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    console.warn("API no disponible, usando agenda local de respaldo.", error);
    return getFallbackAgenda(espacio);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    const message = buildApiErrorMessage(response.status, errorBody);

    if (
      isAuthErrorStatus(response.status) ||
      response.status === 404 ||
      response.status >= 500
    ) {
      console.warn(
        "API no disponible para agenda remota, usando agenda local de respaldo.",
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

  // Tipo por defecto para los items que llegan SIN `tipo_actividad` ni
  // `activityType`. La rama `"Charlas técnicas"` se retiró con la sección
  // (2026-09-01). ⚠️ «Salones temáticos» pasa el filtro de prefijo «Salón»
  // porque `matchesActivityType` compara sin tildes (comprobado).
  const tipoActividad =
    espacio === "laboratorios"
      ? "Laboratorios de entrenamiento"
      : "Salones temáticos";

  if (rawItems.length === 0) {
    console.warn("API sin items de agenda, usando agenda local de respaldo.", {
      espacio,
      payload,
    });
    return getFallbackAgenda(espacio);
  }

  // Se filtra DESPUÉS de comprobar que la API trajo algo: quedarse sin items
  // por descartar los privados es una respuesta legítima (un día que solo
  // tiene agenda privada se ve vacío), no un fallo que justifique el respaldo.
  return rawItems
    .filter(isPublicItem)
    .map((item) => normalizeItem(item, tipoActividad));
}
