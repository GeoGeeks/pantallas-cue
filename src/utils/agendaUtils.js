// src/utils/agendaUtils.js

export function obtenerDiasUnicos(agendaData) {
  const fechasUnicas = [...new Set(agendaData.map((item) => item.fecha))]
    .filter(Boolean)
    .sort();

  const diaSemanaFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long" });
  const mesFormat = new Intl.DateTimeFormat("es-ES", { month: "long" });

  return fechasUnicas.map((fechaStr) => {
    const date = new Date(fechaStr.replace(/\//g, "-") + "T00:00:00");

    const nombreDia = diaSemanaFormat.format(date);
    const diaNumero = date.getDate();
    const nombreMes = mesFormat.format(date);

    const diaCapitalizado =
      nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
    const mesCapitalizado =
      nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    return {
      id: fechaStr,
      label: `${diaCapitalizado} ${diaNumero} ${mesCapitalizado}`,
    };
  });
}
