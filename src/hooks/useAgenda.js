import { useEffect, useMemo, useState } from "react";
import {
  getFilterGroups,
  getUniqueDays,
  getVisibleEvents,
} from "../utils/agendaUtils.js";
import { fetchAgendaData } from "../services/agendaApi.js";

export function useAgenda({ espacio, activityType }) {
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAgenda() {
      try {
        setLoading(true);
        setError("");
        setAgenda(await fetchAgendaData(espacio, { signal: controller.signal }));
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Error cargando la agenda:", err);

        setError("No se pudo cargar la agenda.");
        setAgenda([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAgenda();
    return () => controller.abort();
  }, [espacio]);

  const days = useMemo(
    () => getUniqueDays(agenda, activityType, activeFilters),
    [agenda, activityType, activeFilters],
  );

  useEffect(() => {
    if (days.length === 0) {
      setSelectedDay("");
      return;
    }

    if (!days.some((day) => day.id === selectedDay)) {
      setSelectedDay(days[0].id);
    }
  }, [days, selectedDay]);

  const filterGroups = useMemo(
    () =>
      getFilterGroups(
        agenda,
        activityType,
        activeFilters,
        selectedDay,
        searchQuery,
      ),
    [agenda, activityType, activeFilters, selectedDay, searchQuery],
  );

  const events = useMemo(
    () =>
      getVisibleEvents({
        agenda,
        activityType,
        selectedDay,
        searchQuery,
        activeFilters,
      }),
    [agenda, activityType, selectedDay, searchQuery, activeFilters],
  );

  const addFilter = (newFilter) => {
    setActiveFilters((currentFilters) => {
      const nextFilters = currentFilters.filter(
        (filter) => filter.grupoId !== newFilter.grupoId,
      );

      return [...nextFilters, newFilter];
    });
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters((currentFilters) =>
      currentFilters.filter(
        (filter) =>
          !(
            filter.grupoId === filterToRemove.grupoId &&
            filter.valor === filterToRemove.valor
          ),
      ),
    );
  };

  return {
    activeFilters,
    addFilter,
    clearFilters: () => setActiveFilters([]),
    days,
    error,
    events,
    filterGroups,
    loading,
    removeFilter,
    searchQuery,
    selectedDay,
    setSearchQuery,
    setSelectedDay,
    setShowFilters,
    showFilters,
    toggleFilters: () => setShowFilters((isOpen) => !isOpen),
  };
}
