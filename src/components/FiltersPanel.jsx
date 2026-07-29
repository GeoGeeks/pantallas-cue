// src/components/FiltersPanel.jsx
import React, { useState, useRef, useEffect } from "react";

export default function FiltersPanel({
  gruposFiltros = [],
  filtrosActivos = [],
  onAddFiltro,
  onRemoveFiltro,
  onLimpiarFiltros,
  onClose,
  espacio = "",
  isPanelOpen = true,
}) {
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setDropdownOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };

  return (
    <div className={`filters-panel-container ${espacio}`} ref={containerRef}>
      <div className="filters-bar">
        <div className="filters-header">
          <span className="filtros-label">Filtros {filtrosActivos.length}</span>

          <div className="actions">
            {filtrosActivos.length > 0 && (
              <button
                type="button"
                className="btn-limpiar"
                onClick={onLimpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}

            {isPanelOpen && onClose && (
              <button
                type="button"
                className="btn-close-panel"
                onClick={onClose}
                aria-label="Cerrar filtros"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filters-content">
          {filtrosActivos.map((item) => (
            <div
              key={`${item.grupoId}-${item.valor}`}
              className="filter-chip-active"
            >
              <span>{item.valor}</span>
              <button
                type="button"
                className="btn-remove-chip"
                onClick={() => onRemoveFiltro(item)}
                aria-label={`Eliminar filtro ${item.valor}`}
              >
                ✕
              </button>
              <span className="arrow">˅</span>
            </div>
          ))}

          {isPanelOpen &&
            gruposFiltros.map((grupo) => {
              // Verifica si este grupo ya tiene alguna opción seleccionada activa
              const yaTieneFiltroActivo = filtrosActivos.some(
                (f) => f.grupoId === grupo.id,
              );

              // Si ya hay un filtro de este grupo activo, NO mostramos el botón desplegable blanco adicional
              if (yaTieneFiltroActivo) return null;

              const opcionesUnicas = Array.from(new Set(grupo.opciones || []));
              if (opcionesUnicas.length === 0) return null;

              const isOpen = dropdownOpenId === grupo.id;

              return (
                <div key={grupo.id} className="dropdown-container">
                  <button
                    type="button"
                    className={`btn-dropdown ${isOpen ? "active" : ""}`}
                    onClick={() => toggleDropdown(grupo.id)}
                  >
                    <span>{grupo.label}</span>
                    <span className="arrow">{isOpen ? "ˆ" : "˅"}</span>
                  </button>

                  {isOpen && (
                    <ul className="dropdown-menu">
                      <li
                        className="dropdown-header"
                        onClick={() => setDropdownOpenId(null)}
                      >
                        <span>{grupo.label}</span>
                        <span className="arrow">ˆ</span>
                      </li>
                      {opcionesUnicas.map((opcion) => (
                        <li key={opcion}>
                          <button
                            type="button"
                            onClick={() => {
                              onAddFiltro({ grupoId: grupo.id, valor: opcion });
                              setDropdownOpenId(null);
                            }}
                          >
                            {opcion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
