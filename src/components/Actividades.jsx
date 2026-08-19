import { useEffect, useMemo, useState } from "react";
import { getItemTopics } from "../utils/agendaUtils.js";
import { withBase } from "../config/agenda.js";

export default function Actividades({ eventos = [], espacio }) {
  const [itemAbierto, setItemAbierto] = useState(null);
  const [lugarSeleccionado, setLugarSeleccionado] = useState("");
  const [floorImageIndex, setFloorImageIndex] = useState(0);
  const [floorImageNotFound, setFloorImageNotFound] = useState(false);

  const floorImageCandidates = useMemo(() => {
    if (!lugarSeleccionado) return [];

    const raw = String(lugarSeleccionado).trim();
    const normalized = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const compact = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "");
    const extensions = ["avif", "webp", "png", "jpg", "jpeg"];
    const names = [...new Set([raw, normalized, compact].filter(Boolean))];

    return names.flatMap((name) =>
      extensions.map((ext) => withBase(`images/Piso-Salon/${name}.${ext}`)),
    );
  }, [lugarSeleccionado]);

  useEffect(() => {
    if (!lugarSeleccionado) return;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setLugarSeleccionado("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lugarSeleccionado]);

  const esLaboratorio = (item) => {
    const tipoActividad = String(item.tipo_actividad || "").toLowerCase();
    return espacio === "laboratorios" || tipoActividad.includes("laboratorio");
  };

  const getTextoBoton = (item, abierto) => {
    if (abierto) {
      return esLaboratorio(item)
        ? "Ocultar detalles del laboratorio"
        : "Ocultar detalles de la sesión";
    }

    return esLaboratorio(item)
      ? "Ver detalles del laboratorio"
      : "Ver detalles de la sesión";
  };

  const openFloorMap = (lugar) => {
    setLugarSeleccionado(lugar);
    setFloorImageIndex(0);
    setFloorImageNotFound(false);
  };

  const closeFloorMap = () => {
    setLugarSeleccionado("");
    setFloorImageIndex(0);
    setFloorImageNotFound(false);
  };

  const currentFloorImage = floorImageCandidates[floorImageIndex] || "";
  const hasMoreCandidates = floorImageIndex < floorImageCandidates.length - 1;

  return (
    <>
      <div className={`content-agenda ${espacio}`}>
        <div id="agenda" className={`agenda ${espacio}`}>
          {eventos.map((item) => {
            const tags = getItemTopics(item);
            const itemKey = item.id;
            const abierto = itemAbierto === itemKey;
            const tieneDetalles = Boolean(item.descripcion);

            return (
              <div className="evento" key={itemKey}>
                <div className="hora">{item.hora_inicio}</div>

                <div className="info">
                  <h2 className="nombre">{item.nombre}</h2>

                  {tieneDetalles && (
                    <div className="descripcion">
                      <button
                        type="button"
                        onClick={() =>
                          setItemAbierto((actual) =>
                            actual === itemKey ? null : itemKey,
                          )
                        }
                        aria-expanded={abierto}
                        className={abierto ? "active" : ""}
                      >
                        {getTextoBoton(item, abierto)}
                        <svg className={`icono-flecha ${abierto ? "active" : ""}`}>
                          <use href="#icon-arrow" />
                        </svg>
                      </button>

                      <div
                        className={`descripcion-info ${abierto ? "active" : ""}`}
                      >
                        <p>{item.descripcion}</p>
                      </div>
                    </div>
                  )}

                  <div className="detalles">
                    <div className="box-detalles">
                      <svg className="icono-detalles">
                        <use href="#icon-time" />
                      </svg>
                      <p>
                        {item.hora_inicio}
                        {item.hora_fin ? ` - ${item.hora_fin}` : ""}
                      </p>
                    </div>

                    {item.lugar && (
                      <button
                        type="button"
                        className="box-detalles lugar place-trigger"
                        onClick={() => openFloorMap(item.lugar)}
                        aria-label={`Ver mapa del piso para ${item.lugar}`}
                      >
                        <svg className="icono-detalles">
                          <use href="#icon-pin" />
                        </svg>
                        <span>{item.lugar}</span>
                      </button>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="tematicas">
                      {tags.map((tag) => (
                        <p key={tag}>{tag}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {lugarSeleccionado && (
        <div
          className="floor-map-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeFloorMap();
            }
          }}
        >
          <div className="floor-map-modal" role="dialog" aria-modal="true" aria-label="Mapa del piso">
            <div className="floor-map-header">
              <h2>Mapa del piso</h2>
              <button
                type="button"
                className="floor-map-close"
                onClick={closeFloorMap}
                aria-label="Cerrar mapa del piso"
              >
                <svg aria-hidden="true">
                  <use href="#icon-close" />
                </svg>
              </button>
            </div>

            {currentFloorImage && !floorImageNotFound && (
              <img
                className="floor-map-image"
                src={currentFloorImage}
                alt={`Mapa del piso para ${lugarSeleccionado}`}
                onError={() => {
                  if (hasMoreCandidates) {
                    setFloorImageIndex((currentIndex) => currentIndex + 1);
                    return;
                  }

                  setFloorImageNotFound(true);
                }}
              />
            )}

            {floorImageNotFound && (
              <p className="floor-map-empty">
                No se encontró el mapa del piso para este lugar.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
