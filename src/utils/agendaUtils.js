export function getUniqueDays(
  agendaData,
  activityType,
) {
  const uniqueDates = new Set();
  for (const item of agendaData) {
    if (matchesActivityType(item, activityType) && item.fecha) {
      uniqueDates.add(item.fecha);
    }
  }

  const sortedDates = [...uniqueDates].sort(
    (a, b) => parseDate(a) - parseDate(b),
  );

  const weekdayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
  const monthFormat = new Intl.DateTimeFormat("es-ES", { month: "long" });

  return sortedDates.map((dateValue) => {
    const date = toLocalDate(dateValue);
    const weekday = capitalize(weekdayFormat.format(date));
    const month = capitalize(monthFormat.format(date));

    return { id: dateValue, label: `${weekday} ${date.getDate()} ${month}` };
  });
}

export function getFilterGroups(
  agenda,
  activityType,
  activeFilters = [],
  selectedDay = "",
  searchQuery = "",
) {
  const normalizedQuery = normalizeText(searchQuery);
  const baseItems = agenda.filter(
    (item) =>
      matchesActivityType(item, activityType) &&
      (!selectedDay || item.fecha === selectedDay) &&
      (!normalizedQuery ||
        normalizeText(item.nombre).includes(normalizedQuery) ||
        normalizeText(item.lugar).includes(normalizedQuery)),
  );

  const optionGroups = [
    {
      id: "lugar",
      label: "Lugar - Piso",
      extractOptions: (item) => [item.lugar],
    },
    ...(activityType === "Laboratorios de entrenamiento"
      ? []
      : [
          {
            id: "tematica",
            label: "Temática",
            extractOptions: (item) => getItemTopics(item),
          },
        ]),
    {
      id: "dirigidoA",
      label: "Dirigido a",
      extractOptions: (item) => getValueList(item.audiencias || item.targetAudiences),
    },
    {
      id: "producto",
      label: "Producto",
      extractOptions: (item) => getValueList(item.producto_esri || item.esriProducts),
    },
    {
      id: "nivelSesion",
      label: "Nivel de sesión",
      extractOptions: (item) => [item.nivel || item.sessionLevel],
    },
    {
      id: "industria",
      label: "Industria",
      extractOptions: (item) => getValueList(item.industria || item.industry),
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

  const visibleEvents = agenda
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

  if (activityType === "Laboratorios de entrenamiento") {
    return mergeRepeatedLaboratoryEvents(visibleEvents);
  }

  return visibleEvents;
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
    if (groupId === "lugar") {
      return values.includes(item.lugar);
    }
    if (groupId === "dirigidoA") {
      return values.some((value) => getValueList(item.audiencias || item.targetAudiences).includes(value));
    }
    if (groupId === "producto") {
      return values.some((value) => getValueList(item.producto_esri || item.esriProducts).includes(value));
    }
    if (groupId === "nivelSesion") {
      return values.includes(item.nivel || item.sessionLevel);
    }
    if (groupId === "industria") {
      return values.some((value) => getValueList(item.industria || item.industry).includes(value));
    }
    return true;
  });
}

function getValueList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          return entry.value || entry.name || entry.title || entry.objective || "";
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function compareEvents(a, b) {
  const dateDiff = parseDate(a.fecha) - parseDate(b.fecha);
  if (dateDiff !== 0) return dateDiff;

  const timeDiff = parseTime(a.hora_inicio) - parseTime(b.hora_inicio);
  if (timeDiff !== 0) return timeDiff;

  return (a.nombre || "").localeCompare(b.nombre || "", "es");
}

function mergeRepeatedLaboratoryEvents(events) {
  const eventsByKey = new Map();

  for (const item of events) {
    const key = [item.nombre, item.lugar, item.fecha].map((part) => String(part || "").trim().toLowerCase()).join("::");
    const current = eventsByKey.get(key);

    if (!current) {
      eventsByKey.set(key, { ...item });
      continue;
    }

    const mergedStart = pickEarlierTime(current.hora_inicio, item.hora_inicio);
    const currentEndCandidate = current.hora_fin || current.hora_inicio;
    const itemEndCandidate = item.hora_fin || item.hora_inicio;
    const mergedEnd = pickLaterTime(currentEndCandidate, itemEndCandidate);

    eventsByKey.set(key, {
      ...current,
      hora_inicio: mergedStart,
      hora_fin: mergedEnd && mergedEnd !== mergedStart ? mergedEnd : "",
      tematicas: mergeUniqueList(current.tematicas, item.tematicas),
      producto_esri: mergeUniqueList(current.producto_esri, item.producto_esri),
      audiencias: mergeUniqueList(current.audiencias, item.audiencias),
      industria: mergeUniqueList(current.industria, item.industria),
    });
  }

  return [...eventsByKey.values()].sort(compareEvents);
}

function pickEarlierTime(first, second) {
  if (!first) return second || "";
  if (!second) return first;

  const firstMinutes = parseTime(first);
  const secondMinutes = parseTime(second);

  if (firstMinutes === Number.MAX_SAFE_INTEGER) return second;
  if (secondMinutes === Number.MAX_SAFE_INTEGER) return first;

  return firstMinutes <= secondMinutes ? first : second;
}

function pickLaterTime(first, second) {
  if (!first) return second || "";
  if (!second) return first;

  const firstMinutes = parseTime(first);
  const secondMinutes = parseTime(second);

  if (firstMinutes === Number.MAX_SAFE_INTEGER) return second;
  if (secondMinutes === Number.MAX_SAFE_INTEGER) return first;

  return firstMinutes >= secondMinutes ? first : second;
}

function mergeUniqueList(first, second) {
  const firstList = Array.isArray(first) ? first : [];
  const secondList = Array.isArray(second) ? second : [];

  return [...new Set([...firstList, ...secondList].filter(Boolean))];
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
