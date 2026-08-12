export function getUniqueDays(agendaData) {
  const uniqueDates = [...new Set(agendaData.map((item) => item.fecha))]
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b));

  const weekdayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
  const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "long" });

  return uniqueDates.map((dateValue) => {
    const date = toLocalDate(dateValue);
    const weekday = capitalize(weekdayFormat.format(date));
    const month = capitalize(monthFormat.format(date));

    return { id: dateValue, label: `${weekday} ${date.getDate()} ${month}` };
  });
}

export function getFilterGroups(agenda, activityType, activeFilters = []) {
  const baseItems = agenda.filter((item) => matchesActivityType(item, activityType));

  const optionGroups = [
    {
      id: "tematica",
      label: "Temática",
      extractOptions: (item) => getItemTopics(item),
    },
    {
      id: "tipo",
      label: "Tipo de actividad",
      extractOptions: (item) => [item.tipo_actividad],
    },
    {
      id: "lugar",
      label: "Piso - Lugar",
      extractOptions: (item) => [item.lugar],
    },
  ];

  const groups = optionGroups
    .map((group) => {
      const relevantFilters = activeFilters.filter(
        (filter) => filter.grupoId !== group.id,
      );
      const options = new Set();

      baseItems
        .filter((item) => matchesFilters(item, relevantFilters))
        .forEach((item) => {
          group
            .extractOptions(item)
            .filter(Boolean)
            .forEach((value) => options.add(value));
        });

      return {
        id: group.id,
        label: group.label,
        opciones: [...options].sort((a, b) => a.localeCompare(b, "es")),
      };
    })
    .filter((group) => group.opciones.length > 0);

  return groups;
}

export function getVisibleEvents({
  agenda,
  activityType,
  selectedDay,
  searchQuery,
  activeFilters,
}) {
  const normalizedQuery = normalizeText(searchQuery);

  return agenda
    .filter((item) => {
      const matchesDay = item.fecha === selectedDay;
      const matchesSearch =
        normalizeText(item.nombre).includes(normalizedQuery) ||
        normalizeText(item.lugar).includes(normalizedQuery);

      return (
        matchesActivityType(item, activityType) &&
        matchesDay &&
        matchesSearch &&
        matchesFilters(item, activeFilters)
      );
    })
    .sort(compareEvents);
}

export function getItemTopics(item) {
  if (Array.isArray(item.tematicas)) return item.tematicas.filter(Boolean);
  return item.tematica ? [item.tematica] : [];
}

function matchesActivityType(item, expectedType) {
  const activityType = item.tipo_actividad || "";
  const aliases = {
    "Salones temáticos": ["Salones temáticos", "Salón temático"],
    "Charlas técnicas": [
      "Charlas técnicas",
      "Plenaria",
      "Conferencia",
      "Conversatorio",
      "Mesa redonda",
      "Taller",
      "Seminario",
      "Actividad Social",
    ],
    "Laboratorios de entrenamiento": [
      "Laboratorios de entrenamiento",
      "Laboratorio de entrenamiento",
      "Laboratorio",
      "Laboratorios",
    ],
  };

  return (aliases[expectedType] || [expectedType]).includes(activityType);
}

function matchesFilters(item, activeFilters) {
  if (activeFilters.length === 0) return true;

  const filtersByGroup = activeFilters.reduce((acc, filter) => {
    if (!acc[filter.grupoId]) acc[filter.grupoId] = [];
    acc[filter.grupoId].push(filter.valor);
    return acc;
  }, {});

  return Object.entries(filtersByGroup).every(([groupId, values]) => {
    if (groupId === "tematica") {
      return values.some((value) => getItemTopics(item).includes(value));
    }
    if (groupId === "tipo") {
      return values.includes(item.tipo_actividad);
    }
    if (groupId === "lugar") {
      return values.includes(item.lugar);
    }
    if (groupId === "nivel") {
      return values.includes(item.nivel);
    }
    return true;
  });
}

function compareEvents(a, b) {
  const dateDiff = parseDate(a.fecha) - parseDate(b.fecha);
  if (dateDiff !== 0) return dateDiff;

  const timeDiff = parseTime(a.hora_inicio) - parseTime(b.hora_inicio);
  if (timeDiff !== 0) return timeDiff;

  return (a.nombre || "").localeCompare(b.nombre || "", "es");
}

function parseDate(value) {
  const parts = String(value || "")
    .split(/[/-]/)
    .map((part) => Number(part));

  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [first, second, third] = parts;
  const [year, month, day] =
    first > 31 ? [first, second, third] : [third, second, first];

  return new Date(year, month - 1, day).getTime();
}

function toLocalDate(value) {
  const timestamp = parseDate(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : new Date();
}

function parseTime(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)?/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toLowerCase();

  if (period === "p.m." && hours < 12) hours += 12;
  if (period === "a.m." && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
