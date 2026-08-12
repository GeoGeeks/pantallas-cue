// src/AgendaPage.jsx
import { useAgenda } from "./hooks/useAgenda.js";
import { usePageTitle } from "./hooks/usePageTitle.js";
import Actividades from "./components/Actividades.jsx";
import FiltersPanel from "./components/FiltersPanel.jsx";
import Navbar from "./components/Navbar.jsx";
import Utilities from "./components/Utilities.jsx";

export default function AgendaPage({ espacio, title, activityType }) {
  usePageTitle();

  const agenda = useAgenda({ espacio, activityType });
  const hasError = Boolean(agenda.error);
  const showFilters =
    !agenda.loading &&
    !hasError &&
    (agenda.showFilters || agenda.activeFilters.length > 0);
  const showContent = !agenda.loading && !hasError;

  return (
    <main className={`espacios ${espacio}`}>
      <Navbar title={title} espacio={espacio} />

      {(agenda.loading || hasError) && (
        <div className="estado-container">
          {agenda.loading && (
            <div className="estado-carga">
              <div className="loader" />
            </div>
          )}
          {!agenda.loading && hasError && (
            <p className="estado-error">{agenda.error}</p>
          )}
        </div>
      )}

      {showContent && (
        <>
          <Utilities
            dias={agenda.days}
            diaSeleccionado={agenda.selectedDay}
            onSelectDia={agenda.setSelectedDay}
            searchQuery={agenda.searchQuery}
            onSearchChange={agenda.setSearchQuery}
            espacio={espacio}
            onToggleFilters={agenda.toggleFilters}
            activeFilterCount={agenda.activeFilters.length}
          />

          {showFilters && (
            <FiltersPanel
              gruposFiltros={agenda.filterGroups}
              filtrosActivos={agenda.activeFilters}
              onAddFiltro={agenda.addFilter}
              onRemoveFiltro={agenda.removeFilter}
              onLimpiarFiltros={agenda.clearFilters}
              onClose={() => agenda.setShowFilters(false)}
              espacio={espacio}
              isPanelOpen={agenda.showFilters}
            />
          )}

          <Actividades eventos={agenda.events} espacio={espacio} />
        </>
      )}

      <div className="footer-section">
        <p>
          Personalice su agenda y planee su ruta desde nuestra aplicación móvil.
        </p>

        <svg className="logo-cue">
          <use href="#logo-cue" />
        </svg>
      </div>
    </main>
  );
}
