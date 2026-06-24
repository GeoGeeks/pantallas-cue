import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const espacios = {
  salones: "Salón temático | Esri Colombia",
  charlas: "Sesiones técnicas | Esri Colombia",
  laboratorios: "Laboratorios de entrenamiento | Esri Colombia",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "").split("/").pop();
    const title = espacios[path] || "Agenda CUE25 | Esri Colombia";
    document.title = title;
  }, [location]);
}
