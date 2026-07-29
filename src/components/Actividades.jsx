// src/components/Actividades.jsx
import React from "react";

export default function Actividades({ eventos = [], espacio }) {
  return (
    <div className={`content-agenda ${espacio}`}>
      <div id="agenda" className={`agenda ${espacio}`}>
        {eventos.map((item, index) => {
          const tags = Array.isArray(item.tematicas)
            ? item.tematicas
            : item.tematica
              ? [item.tematica]
              : [];

          return (
            <div
              className="evento"
              key={item.id || `${item.nombre}-${item.hora_inicio}-${index}`}
            >
              <div className="hora">{item.hora_inicio}</div>

              <div className="info">
                <h3 className="nombre">{item.nombre}</h3>

                {item.descripcion && (
                  <div className="descripcion">
                    <p>{item.descripcion}</p>
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
