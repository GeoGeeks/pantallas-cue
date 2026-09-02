export const BASE_URL = import.meta.env.BASE_URL;

/**
 * Los tipos que van a Laboratorios. Lista **cerrada** a propósito: es un tipo
 * único y estable que fija el catálogo, y esa pantalla habla de laboratorios.
 */
export const TIPOS_LABORATORIO = ["Laboratorios de entrenamiento"];

/**
 * Las dos secciones del evento. Panamá no tiene charlas técnicas: se retiró esa
 * pantalla el 2026-09-01.
 *
 * 🔴 `salones` NO enumera tipos, y eso es deliberado. Hasta hoy cada sección se
 * definía por una cadena exacta (`"Salón temático"`, `"Charla técnica"`) y los
 * datos de Panamá pasaron a usar un tipo POR SALÓN —«Salón: GET 5.0», «Salón:
 * ArcGIS & IA»…, once creados desde el panel—. Medido contra producción, esos
 * dos botones encontraban **0 y 0** de 62 charlas: dos de las tres pantallas
 * salían en blanco.
 *
 * Ahora Salones se define por **prefijo**: cualquier tipo que empiece por
 * «Salón». Así los once salones de Panamá entran solos, y los que se creen
 * mañana también, sin tocar código.
 *
 * ⚠️ Decisión del dueño (2026-09-01), y tiene un precio que conviene ver: lo que
 * NO empieza por «Salón» **no se muestra en esta aplicación** —en producción, 4
 * «Actividad social» y 2 «Plenaria»—. Se acepta porque **estas pantallas sólo
 * consumen Salones y Laboratorios**; la agenda completa vive en la PWA, que sí
 * los pinta. Si algún día se crea una categoría con otro nombre («Track: …»,
 * «Sala: …»), aquí no aparecerá: es el riesgo asumido a cambio de que el rótulo
 * de la pantalla sea cierto.
 */
export const AGENDA_SECTIONS = {
  salones: {
    title: "Salones temáticos",
    filtroTipo: { prefijo: "Salón" },
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
