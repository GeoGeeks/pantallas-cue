import { useState } from "react";

export default function Utilities({
  dias = [],
  diaSeleccionado,
  onSelectDia,
  searchQuery,
  onSearchChange,
  espacio,
  onToggleFilters,
  activeFilterCount = 0,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCloseSearch = () => {
    onSearchChange("");
    setSearchOpen(false);
  };

  const getDayParts = (dia) => {
    const [weekday, ...restParts] = String(dia.label || "").split(" ");
    return {
      weekday,
      restLabel: restParts.join(" "),
    };
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
            onChange={(event) => onSearchChange(event.target.value)}
            autoFocus
          />

          <div className="search-actions">
            {searchQuery && (
              <button
                type="button"
                className="btn-clear"
                onClick={() => onSearchChange("")}
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
            {dias.map((dia) => {
              const { weekday, restLabel } = getDayParts(dia);

              return (
                <button
                  key={dia.id}
                  type="button"
                  className={`tab-btn ${
                    diaSeleccionado === dia.id ? "active" : ""
                  }`}
                  onClick={() => onSelectDia(dia.id)}
                >
                  <span className="tab-btn-weekday">{weekday}</span>
                  {restLabel && (
                    <span className="tab-btn-rest">{restLabel}</span>
                  )}
                </button>
              );
            })}
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
              onClick={onToggleFilters}
              aria-label="Filtrar"
            >
              <svg className="icon">
                <use href="#icon-filter" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
