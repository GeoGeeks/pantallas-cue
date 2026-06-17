export const Formatter = {
  normalize: (str) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "",
  formatDate: (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split(/[-/]/);
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  },
  formatTime: (dateTimeStr) => {
    const timePart = dateTimeStr.includes(" ")
      ? dateTimeStr.split(" ")[1]
      : dateTimeStr;
    const [hh, mm] = timePart.split(":");
    let hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? "p.m." : "a.m.";
    hour = hour % 12 || 12;
    return `${hour}:${mm || "00"} ${ampm}`;
  },
};
