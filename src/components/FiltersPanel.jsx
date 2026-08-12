import { useEffect, useRef, useState } from "react";

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
  const labelByGroup = gruposFiltros.reduce((acc, grupo) => {
    acc[grupo.id] = grupo.label;
    return acc;
  }, {});

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    setDropdownOpenId((openId) => (openId === id ? null : id));
  };

  const activeFilterChips = filtrosActivos.map((filter) => {
    const label = labelByGroup[filter.grupoId] || filter.grupoId;
    return (
      <button
        key={`${filter.grupoId}-${filter.valor}`}
        type="button"
        className="filter-chip-active filter-chip-collapsed"
        onClick={() => onRemoveFiltro(filter)}
        aria-label={`Eliminar filtro ${label}: ${filter.valor}`}
      >
        <span>{label}: {filter.valor}</span>
        <span className="chip-remove">×</span>
      </button>
    );
  });

  if (!isPanelOpen && filtrosActivos.length > 0) {
    return (
      <div className={`filters-panel-container ${espacio} filters-panel-collapsed`} ref={containerRef}>
        <div className="filters-panel-collapsed-card">
          <div className="filter-chip-list">{activeFilterChips}</div>
          <button
            type="button"
            className="btn-link limpiar-filtros"
            onClick={onLimpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`filters-panel-container ${espacio}`} ref={containerRef}>
      <div className="filters-panel-card">
        <div className="filters-panel-header">
          <div>
            <p className="filters-title">Filtros</p>
          </div>

          <div className="filters-panel-actions">
            {filtrosActivos.length > 0 && (
              <button
                type="button"
                className="btn-link limpiar-filtros"
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
                ×
              </button>
            )}
          </div>
        </div>

        <div className="filters-panel-body">
          {gruposFiltros.map((grupo) => {
            const activeValue = filtrosActivos.find(
              (filter) => filter.grupoId === grupo.id,
            )?.valor;
            const uniqueOptions = [...new Set(grupo.opciones || [])];
            const isOpen = dropdownOpenId === grupo.id;
            const labelText = activeValue
              ? activeValue
              : `Seleccionar ${grupo.label.toLowerCase()}`;

            return (
              <div key={grupo.id} className="filter-row">
                <div className="filter-row-label">{grupo.label}</div>
                <div className="filter-row-control">
                  <button
                    type="button"
                    className={`btn-dropdown ${activeValue ? "selected" : ""}`}
                    onClick={() => toggleDropdown(grupo.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{labelText}</span>
                    <svg className={`arrow-icon ${isOpen ? "active" : ""}`} aria-hidden="true">
                      <use href="#icon-arrow" xlinkHref="#icon-arrow" />
                    </svg>
                  </button>

                  {isOpen && (
                    <ul className="dropdown-menu">
                      {/* <li className="dropdown-header" onClick={() => setDropdownOpenId(null)}>
                        <span>{grupo.label}</span>
                        <span className="arrow">⌃</span>
                      </li> */}
                      {uniqueOptions.length === 0 ? (
                        <li>
                          <div className="dropdown-empty">No hay opciones disponibles</div>
                        </li>
                      ) : (
                        uniqueOptions.map((opcion) => (
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
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
