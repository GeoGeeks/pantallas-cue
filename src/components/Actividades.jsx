import { useState } from "react";
import { getItemTopics } from "../utils/agendaUtils.js";

export default function Actividades({ eventos = [], espacio }) {
  const [itemAbierto, setItemAbierto] = useState(null);

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

  return (
    <div className={`content-agenda ${espacio}`}>
      <div id="agenda" className={`agenda ${espacio}`}>
        {eventos.map((item, index) => {
          const tags = getItemTopics(item);
          const itemKey = item.id || `${item.nombre}-${item.hora_inicio}-${index}`;
          const abierto = itemAbierto === itemKey;
          const tieneDetalles = Boolean(item.descripcion);

          return (
            <div className="evento" key={itemKey}>
              <div className="hora">{item.hora_inicio}</div>

              <div className="info">
                <h3 className="nombre">{item.nombre}</h3>

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
                    <div className="box-detalles lugar">
                      <svg className="icono-detalles">
                        <use href="#icon-pin" />
                      </svg>
                      <p>{item.lugar}</p>
                    </div>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="tematicas">
                    {tags.map((tag, tagIndex) => (
                      <p key={`${tag}-${tagIndex}`}>{tag}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
