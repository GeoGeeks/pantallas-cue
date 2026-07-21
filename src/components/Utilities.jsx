// src/components/Utilities.jsx
import React, { useState } from "react";

export default function Utilities({
  dias = [],
  diaSeleccionado,
  onSelectDia,
  searchQuery,
  onSearchChange,
  espacio,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleClearSearch = () => {
    onSearchChange("");
  };

  const handleCloseSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
  };

  return (
    <div className={`utilities-bar ${espacio}`}>
      {searchOpen ? (
        <div className="search-bar-container">
          <svg className="icon search-icon">
            <use href="#icon-search" />
          </svg>

          <input
            type="text"
            className="search-input"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />

          <div className="search-actions">
            {searchQuery && (
              <button
                type="button"
                className="btn-clear"
                onClick={handleClearSearch}
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              className="btn-close-search"
              onClick={handleCloseSearch}
              aria-label="Cerrar búsqueda"
            >
              <svg className="icon close-icon">
                <use href="#icon-close" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="days-bar-container">
          <div className="days-tabs">
            {dias.map((dia) => (
              <button
                key={dia.id}
                type="button"
                className={`tab-btn ${
                  diaSeleccionado === dia.id ? "active" : ""
                }`}
                onClick={() => onSelectDia(dia.id)}
              >
                {dia.label}
              </button>
            ))}
          </div>

          <div className="actions-right">
            <button
              type="button"
              className="action-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Abrir búsqueda"
            >
              <svg className="icon">
                <use href="#icon-search" />
              </svg>
            </button>

            <button
              type="button"
              className="action-btn filter-btn"
              aria-label="Filtrar"
            >
              <svg className="icon">
                <use href="#icon-filter" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
