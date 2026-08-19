export const BASE_URL = import.meta.env.BASE_URL;

export const AGENDA_SECTIONS = {
  salones: {
    title: "Salones temáticos",
    activityType: "Salón temático",
  },
  charlas: {
    title: "Charlas técnicas",
    activityType: "Charla técnica",
  },
  laboratorios: {
    title: "Laboratorios de entrenamiento",
    activityType: "Laboratorios de entrenamiento",
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
