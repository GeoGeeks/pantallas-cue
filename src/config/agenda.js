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
 * Ahora Salones es **todo lo que no es laboratorio**. Con una lista, cada tipo
 * nuevo nace invisible y nadie se entera; invertida, aparece solo. Es el mismo
 * arreglo que en la PWA y, antes, el de la lista de nginx en Biodont.
 *
 * ⚠️ El precio, dicho en voz alta: entran también los tipos que no empiezan por
 * «Salón» —en producción, 4 «Actividad social» y 2 «Plenaria»—. Se prefiere eso
 * a esconderlos: una pantalla de agenda que omite el almuerzo o la plenaria
 * miente por defecto, y el fallo se ve, que es lo que no pasaba antes.
 */
export const AGENDA_SECTIONS = {
  salones: {
    title: "Salones temáticos",
    filtroTipo: { excluir: TIPOS_LABORATORIO },
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
