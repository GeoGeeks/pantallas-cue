import { withBase, ID_EVENTO } from "../config/agenda";

const API_BASE_URL = withBase("/api/agenda");

/**
 * Conectado 2026-09-22 al backend real de Colombia (`appmovilapi.esri.co`),
 * a través del proxy propio (`vite.config.js` en dev, `server/` + IIS en
 * producción) — nunca directo desde el navegador. El proxy reenvía
 * `withBase("/api/agenda")/*` hacia `https://appmovilapi.esri.co/api/*` tal
 * cual, así que las rutas de abajo son las rutas REALES del backend
 * (`/admin/eventos/{id}/charlas`, verificadas en vivo con `curl`, 200 sin
 * token — ver `README.md` §Colombia).
 *
 * ⚠️ `salones` Y `charlas` apuntan al MISMO endpoint (`/charlas`) y no es un
 * error: es el único endpoint de listado que no es de laboratorios en esta
 * API. Las dos secciones se resuelven DESPUÉS, por el tipo de actividad
 * (`AGENDA_SECTIONS.*.filtroTipo`), no por la URL — igual que antes del
 * 2026-09-01 en Panamá.
 *
 * 🔴 Son las rutas `/admin/...`, no las rutas de asistente (`/api/eventos/
 * {id}/charlas`, que sí piden bearer). Están abiertas hoy por un hueco de
 * seguridad ya documentado en el panel de administración de CUE_CO
 * (`EntraIdGuard` sin aplicar a esas rutas), no porque el backend las haya
 * declarado públicas a propósito — si el equipo de backend cierra ese hueco,
 * esto empieza a dar 401 sin aviso. Ver el pendiente en el README.
 */
const ENDPOINTS = {
  salones: `/admin/eventos/${ID_EVENTO}/charlas`,
  charlas: `/admin/eventos/${ID_EVENTO}/charlas`,
  laboratorios: `/admin/eventos/${ID_EVENTO}/laboratorios`,
};

/**
 * El contrato real (`nombre/descripcion/fecha/horaInicio/horaFin/
 * tipoActividad/lugar/visibilidad/tematicas[]/productosEsri[]/
 * publicosObjetivo[]/nivelesSesion[]`) no se parece al viejo contrato de
 * EC/PA (`name/description/date/startTime/...`) que el resto de este archivo
 * ya sabe leer. En vez de reescribir `normalizeItem` y todo lo que depende de
 * su forma de salida (`agendaUtils.js`, `Actividades.jsx`), se traduce ACÁ,
 * en la frontera, al contrato viejo — es la única función nueva que conoce
 * los dos lados.
 *
 * Los catálogos (`tematicas`, `productosEsri`, `publicosObjetivo`,
 * `nivelesSesion`) llegan como arreglos de `{id, valor, valorNormalizado}`,
 * varios con `valor: ""` (catálogo global sin usar todavía en este evento) —
 * se descartan con `.filter(Boolean)`, igual que ya hacía `normalizeList`
 * con sus propias entradas vacías.
 *
 * `nivelesSesion` es un ARREGLO en el contrato real (antes `sessionLevel` era
 * un string suelto). Se toma el primero: hoy cada charla/laboratorio trae
 * como máximo uno, y `nivel` se usa como valor único en los filtros
 * (`agendaUtils.js`), no como lista.
 *
 * `industry` no existe en el contrato real — no hay endpoint ni campo
 * equivalente a la industria del Figma de Panamá. El filtro "Industria" del
 * panel de filtros queda sin opciones y se oculta solo (`getFilterGroups` ya
 * descarta los grupos sin opciones), no hace falta tocar la UI.
 *
 * Los laboratorios SÍ traen `tematicas`/`productosEsri`/`publicosObjetivo`/
 * `nivelesSesion` (verificado 2026-09-22 contra los 6 reales: cada uno con
 * 1-2 temáticas propias, ej. "Model Builder", "BIM 3D", "Drones") — se leen
 * igual que en charlas. Traen ADEMÁS `objetivos[]`, `cupo` y `disponibilidad`,
 * que hoy no pinta ninguna pantalla y quedan sin usar.
 */
function adaptRealApiItem(raw) {
  const pickValores = (lista) =>
    Array.isArray(lista)
      ? lista.map((entrada) => entrada?.valor || "").filter(Boolean)
      : [];

  return {
    id: raw.id,
    name: raw.nombre,
    description: raw.descripcion,
    date: raw.fecha,
    startTime: raw.horaInicio,
    endTime: raw.horaFin,
    location: raw.lugar,
    sessionLevel: pickValores(raw.nivelesSesion)[0] || "",
    topics: pickValores(raw.tematicas),
    esriProducts: pickValores(raw.productosEsri),
    targetAudiences: pickValores(raw.publicosObjetivo),
    tipo_actividad: raw.tipoActividad,
    visibility: raw.visibilidad,
  };
}

/**
 * Respaldo cableado de la agenda. ⚠️ Los lugares y las fechas son de EJEMPLO
 * («Salón A», «Laboratorio 1»): no existen en el venue real de Colombia, y
 * eso es lo único que hoy delata en pantalla que estos datos no son reales.
 *
 * 🔴 NO rellenarlo con los salones y las fechas de verdad. Sería peor: dejaría
 * el respaldo indistinguible de la agenda real para quien mire el kiosco. Si
 * hace falta agenda de verdad sin backend, va por el proxy contra la API, no
 * por aquí.
 *
 * Colombia reintroduce `charlas` (se había retirado el 2026-09-01 con la
 * sección, para Panamá). El tipo va con prefijo «Charla», igual que la
 * sección real — ver el aviso en `config/agenda.js` sobre que este prefijo
 * no está verificado contra un catálogo real todavía.
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
  charlas: [
    {
      name: "Mapas y análisis espacial",
      description: "Ver detalles de la sesión",
      date: "2026-10-02",
      startTime: "2026-10-02T14:00:00",
      endTime: "2026-10-02T15:00:00",
      location: "Salón B",
      sessionLevel: "Básico",
      topics: ["Cartografía", "Analítica espacial"],
      esriProducts: ["ArcGIS Online"],
      targetAudiences: ["Público general"],
      industry: ["Educación", "Gobierno"],
      tipo_actividad: "Charla técnica",
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

/**
 * 🔴 A propósito NO convierte zona horaria. El backend real de Colombia
 * manda `horaInicio`/`horaFin` con sufijo `Z` (ej. `2026-10-01T08:00:00.000Z`,
 * "UTC"), pero convertir de verdad (UTC−5) dejaría una Plenaria de apertura a
 * las 3:00 a.m. — un dato real de evento no se abre a esa hora. Es el mismo
 * síntoma que ya se documentó en `CUE_EC` (`useUTC:true` NO arregla el
 * desfase): todo indica que el backend guarda la hora de pared de Bogotá y la
 * marca como si fuera UTC. Se toman los dígitos tal cual, ignorando el sufijo
 * — sin verificarlo contra el cronograma real del evento (nadie lo ha hecho
 * todavía). Si algún día una hora se ve corrida, empezar por aquí. */
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
 * Las charlas privadas (`visibilidad: "privada"` en el contrato real,
 * traducido a `visibility` por `adaptRealApiItem`) son asignaciones que el
 * panel hace usuario por usuario: no son agenda pública y no deben verse en
 * las pantallas del evento. Esta app consulta la ruta ADMIN
 * (`/admin/eventos/{id}/charlas`, sin token — ver `ENDPOINTS`), que las
 * recibe todas mezcladas con las públicas; el filtro de abajo es lo único
 * que las separa antes de pintarlas en el kiosco.
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

/**
 * Tipo por defecto para los items que llegan SIN `tipo_actividad` ni
 * `activityType` — y para el respaldo cableado. Colombia reintroduce
 * `charlas`, que Panamá había retirado (2026-09-01) junto con esa rama.
 * ⚠️ Los tres textos pasan el filtro de prefijo de su sección porque
 * `matchesActivityType` compara sin tildes (comprobado).
 */
function defaultTipoActividad(espacio) {
  if (espacio === "laboratorios") return "Laboratorios de entrenamiento";
  if (espacio === "charlas") return "Charla técnica";
  return "Salón temático";
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
  return fallback.map((item) =>
    normalizeItem(item, defaultTipoActividad(espacio)),
  );
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

  const tipoActividad = defaultTipoActividad(espacio);

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
  //
  // `isDeleted` es del contrato real (borrado lógico): se descarta ANTES de
  // adaptar, sobre el item crudo — `adaptRealApiItem` no lo traduce a ningún
  // campo del contrato viejo, así que filtrarlo después ya no sería posible.
  return rawItems
    .filter((item) => !item?.isDeleted)
    .map((item) => adaptRealApiItem(item))
    .filter(isPublicItem)
    .map((item) => normalizeItem(item, tipoActividad));
}
