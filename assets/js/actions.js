/* Detalles */
function showMoreInfo(e, link) {
  e.preventDefault();
  const p = link.nextElementSibling;
  if (!p) return;

  const icon = link.querySelector("svg");

  if (p.classList.contains("open")) {
    const startHeight = p.scrollHeight;
    p.style.maxHeight = startHeight + "px";
    requestAnimationFrame(() => {
      p.style.transition = "max-height 0.4s ease, margin-top 0.4s ease";
      p.style.maxHeight = "0";
      p.style.marginTop = "0";
    });
    p.classList.remove("open");
    icon.classList.remove("rotated");
    link.childNodes[0].nodeValue = "Ver detalles de la sesión";

    p.addEventListener("transitionend", function te() {
      p.style.transition = "";
      p.removeEventListener("transitionend", te);
    });
  } else {
    p.classList.add("open");
    p.style.transition = "max-height 0.4s ease, margin-top 0.4s ease";
    p.style.maxHeight = p.scrollHeight + "px";
    p.style.marginTop = "0.5rem";
    icon.classList.add("rotated");
    link.childNodes[0].nodeValue = "Ocultar información";

    p.addEventListener("transitionend", function te() {
      if (p.classList.contains("open")) p.style.maxHeight = "none";
      p.style.transition = "";
      p.removeEventListener("transitionend", te);
    });
  }
}
