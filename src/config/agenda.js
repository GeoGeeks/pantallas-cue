export const BASE_URL = import.meta.env.BASE_URL;

/**
 * Backend real de Colombia (`appmovilapi.esri.co`, NestJS + SQL Server — el
 * mismo que usa el panel de administración de CUE_CO, no el `rest_pwa_ec_2026`
 * de EC/PA). Conectado 2026-09-22. El código del evento no vive en ningún
 * catálogo público; se confirmó pidiendo `GET /api/admin/eventos/CUE_26_CO`
 * contra el backend real (200, con `imagenUrl` y `modulosHabilitados`).
 */
export const ID_EVENTO = import.meta.env.VITE_ID_EVENTO || "CUE_26_CO";

/**
 * Los tipos que van a Laboratorios. Lista **cerrada** a propósito: es un tipo
 * único y estable que fija el catálogo, y esa pantalla habla de laboratorios.
 *
 * 🔴 Corregido 2026-09-22: decía «Laboratorios de entrenamiento» (el título de
 * la pantalla, no un dato real) y los 6 laboratorios reales de
 * `GET /api/admin/eventos/CUE_26_CO/laboratorios` traen
 * `tipoActividad: "Laboratorio practico"` — con ese valor viejo, el filtro
 * `incluir` no calzaba con NINGUNO y la pantalla de Laboratorios se habría
 * visto vacía pese a tener datos reales. Se deja como lista cerrada (no por
 * prefijo, a diferencia de Salones/Charlas) porque cambiar la forma del
 * `filtroTipo` le quitaría a `agendaUtils.js` la señal que usa para fusionar
 * un mismo laboratorio repetido en varias franjas — ver `mergeRepeatedLabora
 * toryEvents`. Sigue siendo frágil si el panel agrega un segundo tipo de
 * laboratorio: hoy los 6 reales comparten ese único valor.
 */
export const TIPOS_LABORATORIO = ["Laboratorio practico"];

/**
 * Las TRES secciones del evento (Colombia, 2026-09-22). Panamá solo tenía dos
 * —Salones y Laboratorios—; Colombia reintroduce Charlas técnicas, que el
 * export del Figma (`actualizacion-Colombia/Colombia.png`) muestra como un
 * tercer botón en Inicio y una tercera fila en el menú Espacios.
 *
 * 🔴 `salones` y `charlas` NO enumeran tipos, y eso es deliberado. Antes del
 * 2026-09-01 cada sección se definía por una cadena EXACTA (`"Salón
 * temático"`, `"Charla técnica"`) y los datos de Panamá pasaron a usar un tipo
 * POR SALÓN —«Salón: GET 5.0», «Salón: ArcGIS & IA»…, creados desde el
 * panel—. Medido contra producción, esos botones encontraban **0** charlas:
 * la pantalla salía en blanco. Por eso las dos van por **prefijo**: cualquier
 * tipo que empiece por «Salón» o por «Charla» entra solo, sin tocar código
 * cuando el panel cree uno nuevo.
 *
 * 🔴 Verificado 2026-09-22 contra el catálogo REAL de Colombia (71 charlas de
 * `GET /api/admin/eventos/CUE_26_CO/charlas`) y el prefijo SÍ calza para las
 * dos secciones que lo usan: 12 `tipoActividad` empiezan por «Salón» (con una
 * falta de ortografía real en el dato — conviven «Salón para sector» y «Salón
 * para sectors», el prefijo cubre las dos) y 25 empiezan por «Charla».
 *
 * 🔴 PERO 29 de las 71 charlas reales (41 %) NO empezaban por «Salón» ni por
 * «Charla», y no son laboratorios: 6 «Summit Territorios conectados», 5
 * «Summit GeoIA», 5 «Meet & Greet», 5 «Summit Operaciones conectadas», 5
 * «Summit Imágenes y teledectección» (sic, typo real del dato — por eso va
 * por prefijo «Summit», no por cadena exacta), 4 «Summit Operaciones
 * inteligentes», 2 «Plenaria», 2 «Actividad social». Elevado al dueño
 * 2026-09-22; decisión (mismo día):
 *
 *   · Los 25 «Summit …» entran a **Salones temáticos** (prefijo «Summit»,
 *     igual de robusto que «Salón» — un Summit nuevo entra solo).
 *   · «Meet & Greet» (5) entra a **Charlas técnicas** — va por `ademas`
 *     porque es una cadena EXACTA, no una familia por prefijo: solo hay un
 *     tipo así, no una serie «Meet & Greet algo» que justifique tratarlo
 *     como prefijo.
 *   · «Plenaria» y «Actividad social» (4, Break/Almuerzo) se QUEDAN FUERA a
 *     propósito — son logística del evento, no contenido que alguien busque
 *     en la agenda del kiosco.
 */
export const AGENDA_SECTIONS = {
  salones: {
    title: "Salones temáticos",
    filtroTipo: { prefijos: ["Salón", "Summit"] },
  },
  charlas: {
    title: "Charlas técnicas",
    filtroTipo: { prefijo: "Charla", ademas: ["Meet & Greet"] },
  },
  laboratorios: {
    title: "Laboratorios de entrenamiento",
    filtroTipo: { incluir: TIPOS_LABORATORIO },
  },
};

export const MENU_ITEMS = Object.entries(AGENDA_SECTIONS).map(
  ([path, section]) => ({
    label: section.title,
    path: `/${path}`,
  }),
);

export function withBase(path) {
  return `${BASE_URL}${path}`.replace(/\/{2,}/g, "/");
}
