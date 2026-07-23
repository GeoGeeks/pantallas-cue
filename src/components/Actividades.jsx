// src/components/Actividades.jsx
import React from "react";

export default function Actividades({ eventos = [], espacio }) {
  return (
    <div className={`content-agenda ${espacio}`}>
      <div id="agenda" className={`agenda ${espacio}`}>
        {eventos.map((item) => (
          <div className="evento" key={`${item.nombre}-${item.hora_inicio}`}>
            <div className="hora">
              {item.hora_inicio}
            </div>
            <div className="info">
              <h3 className="nombre">{item.nombre}</h3>
              <div className="descripcion">
                <p>{item.descripcion}</p>
              </div>
              <div className="detalles">
                <div className="box-detalles">
                  <svg className="icono-detalles">
                    <use href="#icon-time" />
                  </svg>
                  <p>{item.hora_inicio}</p>
                </div>
                <div className="box-detalles lugar">
                  <svg className="icono-detalles">
                    <use href="#icon-pin" />
                  </svg>
                  <p>{item.lugar}</p>
                </div>
              </div>
              <div className="tematicas">
                <p>{item.tematica}</p>
                <p>{item.tematica}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
