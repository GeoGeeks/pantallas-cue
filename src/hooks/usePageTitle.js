import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Una entrada por sección de AGENDA_SECTIONS.
const espacios = {
  salones: "Salón temático | Esri Colombia",
  charlas: "Charla técnica | Esri Colombia",
  laboratorios: "Laboratorios de entrenamiento | Esri Colombia",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "").split("/").pop();
    const title = espacios[path] || "Agenda CUE26 | Esri Colombia";
    document.title = title;
  }, [location]);
}
