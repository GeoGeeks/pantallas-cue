// src/components/ContentSegmento.jsx
import React from "react";

export default function ContentSegmento({ eventos = [], espacio }) {
  return (
    <div className={`content-agenda ${espacio}`}>
      <div id="agenda" className={`agenda ${espacio}`}>
        {eventos.map((item) => (
          <div className="evento" key={`${item.nombre}-${item.hora_inicio}`}>
            <div className="hora">
              <p>{item.hora_inicio}</p>
            </div>
            <div className="info">
              <h3 className="nombre">{item.nombre}</h3>
              <p>{item.lugar}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
