import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Una entrada por sección de AGENDA_SECTIONS. La de `charlas` se retira
// junto con su ruta: sin ruta nunca casaba, y dejarla sugiere que existe.
const espacios = {
  salones: "Salón temático | Esri Panamá",
  laboratorios: "Laboratorios de entrenamiento | Esri Panamá",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "").split("/").pop();
    const title = espacios[path] || "Agenda CUE26 | Esri Panamá";
    document.title = title;
  }, [location]);
}
