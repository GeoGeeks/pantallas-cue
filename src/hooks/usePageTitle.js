import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const espacios = {
  salones: "Salón temático | Esri Ecuador",
  charlas: "Sesiones técnicas | Esri Ecuador",
  laboratorios: "Laboratorios de entrenamiento | Esri Ecuador",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "").split("/").pop();
    const title = espacios[path] || "Agenda CUE26 | Esri Ecuador";
    document.title = title;
  }, [location]);
}
