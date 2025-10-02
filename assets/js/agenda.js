let data = [];
let temporizador;

const agenda = document.getElementById("agenda");
const buscar = document.getElementById("buscar");
const clearSearch = document.getElementById("clear-buscar");
const tematica = document.getElementById("tematica");
const producto = document.getElementById("producto");
const nivel = document.getElementById("nivel");
const lugar = document.getElementById("lugar");
const dia = document.getElementById("dia");
const dirigido = document.getElementById("dirigido");
const verMapa = document.getElementById("ver-mapa");
const modal = document.getElementById("mapaModal");
const mapaImg = document.getElementById("mapa-img");
const closeBtn = document.querySelector(".close");
const tiempoInactividad = 3 * 30 * 1000;

const mapaImgs = {
  "Piso 2 - Salón A": "assets/images/Piso-Salon/P2SA.avif",
  "Piso 2 - Salón BC": "assets/images/Piso-Salon/P2SBC.avif",
  "Piso 2 - Salón D": "assets/images/Piso-Salon/P2SD.avif",
  "Piso 2 - Salón EFG": "assets/images/Piso-Salon/P2SEFG.avif",
  "Piso 3 - Salón HI": "assets/images/Piso-Salon/P3SHI.avif",
  "Piso 3 - Salón J": "assets/images/Piso-Salon/P3SJ.avif",
  "Piso 3 - Salón K": "assets/images/Piso-Salon/P3SK.avif",
  "Piso 3 - Salón LM": "assets/images/Piso-Salon/P3SLM.avif",
  "Piso 3 - Salón N": "assets/images/Piso-Salon/P3SN.avif",
  "Piso 3 - Salón ÑO": "assets/images/Piso-Salon/P3SÑO.avif",
  "Piso 3 - Salón ÑOP": "assets/images/Piso-Salon/P3SÑOP.avif",
  "Piso 3 - Salón P": "assets/images/Piso-Salon/P3SP.avif",
};

window.onload = resetearTemporizador;
document.onmousemove = resetearTemporizador;
document.addEventListener("keypress", resetearTemporizador);
document.ontouchstart = resetearTemporizador;
document.onclick = resetearTemporizador;
document.onscroll = resetearTemporizador;

lugar.addEventListener("change", () => {
  const valor = lugar.value;
  if (mapaImgs[valor]) {
    verMapa.style.display = "inline-block";
    verMapa.onclick = () => {
      mapaImg.src = mapaImgs[valor];
      modal.style.display = "flex";
    };
  } else {
    verMapa.style.display = "none";
    mapaImg.src = "";
  }
});

closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

/* ================================
   🔹 SELECT PERSONALIZADO
================================ */
document.querySelectorAll(".sel").forEach((customSel) => {
  const select = customSel.querySelector("select");
  if (!select) return;
  select.style.display = "none";

  const placeholder = document.createElement("span");
  placeholder.className = "sel__placeholder";
  placeholder.textContent = select.dataset.placeholder || "Seleccionar opción";
  placeholder.dataset.placeholder =
    select.dataset.placeholder || "Seleccionar opción";

  const clearBtn = document.createElement("span");
  clearBtn.className = "sel__clear";
  clearBtn.innerHTML = "&#10005;";
  clearBtn.title = "Restablecer";
  clearBtn.style.display = "none";

  const box = document.createElement("div");
  box.className = "sel__box";

  function buildOptions() {
    box.innerHTML = "";
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      if (!option.value) continue;

      const optionEl = document.createElement("div");
      optionEl.className = "sel__box__options";
      optionEl.textContent = option.text;
      optionEl.dataset.value = option.value;
      optionEl.dataset.text = option.text;

      optionEl.addEventListener("click", (e) => {
        e.stopPropagation();
        box
          .querySelectorAll(".sel__box__options")
          .forEach((el) => el.classList.remove("selected"));
        optionEl.classList.add("selected");
        placeholder.textContent = optionEl.dataset.text;
        customSel.classList.add("has-value");
        clearBtn.style.display = "block";
        optionEl.appendChild(clearBtn);
        select.value = optionEl.dataset.value;
        select.dispatchEvent(new Event("change"));
        customSel.classList.remove("active");
        customSel.appendChild(clearBtn);
      });

      box.appendChild(optionEl);
    }
    box.querySelectorAll(".sel__box__options").forEach((opt, i) => {
      opt.style.setProperty("--delay", `${i * 0.05}s`);
    });
  }

  buildOptions();

  const obs = new MutationObserver(() => {
    buildOptions();
    const selOpt = box.querySelector(
      `.sel__box__options[data-value="${select.value}"]`
    );
    if (selOpt) {
      placeholder.textContent = selOpt.dataset.text;
      clearBtn.style.display = "block";
    }
  });
  obs.observe(select, { childList: true });

  clearBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    select.value = "";
    placeholder.textContent = placeholder.dataset.placeholder;
    customSel.classList.remove("has-value", "active");
    box
      .querySelectorAll(".sel__box__options")
      .forEach((el) => el.classList.remove("selected"));
    clearBtn.style.display = "none";
    customSel.appendChild(clearBtn);
    select.dispatchEvent(new Event("change"));
  });

  customSel.prepend(placeholder);
  customSel.appendChild(clearBtn);
  customSel.appendChild(box);

  customSel.addEventListener("click", (e) => {
    if (e.target.classList.contains("sel__box__options")) return;
    customSel.classList.toggle("active");

    if (customSel.classList.contains("active")) {
      box
        .querySelectorAll(".sel__box__options")
        .forEach((el) => el.classList.remove("selected"));
      const selectedOption = box.querySelector(
        `.sel__box__options[data-value="${select.value}"]`
      );
      if (selectedOption) {
        selectedOption.classList.add("selected");
        clearBtn.style.display = "block";
        selectedOption.appendChild(clearBtn);
      }
      placeholder.textContent = placeholder.dataset.placeholder;
    } else {
      customSel.appendChild(clearBtn);
      if (select.value) {
        const selectedOption = box.querySelector(
          `.sel__box__options[data-value="${select.value}"]`
        );
        if (selectedOption)
          placeholder.textContent = selectedOption.dataset.text;
      } else {
        placeholder.textContent = placeholder.dataset.placeholder;
        clearBtn.style.display = "none";
      }
    }
  });
});

document.getElementById("limpiar-filtros").addEventListener("click", () => {
  [tematica, producto, nivel, lugar, dia, dirigido].forEach((sel) => {
    if (sel) {
      sel.value = "";
      sel.dispatchEvent(new Event("change"));
      const customSel = sel.closest(".sel");
      if (customSel) {
        const placeholder = customSel.querySelector(".sel__placeholder");
        const clearBtn = customSel.querySelector(".sel__clear");
        const box = customSel.querySelector(".sel__box");

        placeholder.textContent = placeholder.dataset.placeholder;
        clearBtn.style.display = "none";
        box
          .querySelectorAll(".sel__box__options")
          .forEach((el) => el.classList.remove("selected"));

        customSel.classList.remove("has-value", "active");
      }
    }
  });

  update();
  toggleClearButton();
  toggleLimpiarFiltros();
});

document.addEventListener("click", (e) => {
  document.querySelectorAll(".sel").forEach((sel) => {
    if (!sel.contains(e.target)) {
      sel.classList.remove("active");
      const select = sel.querySelector("select");
      const placeholder = sel.querySelector(".sel__placeholder");
      const clearBtn = sel.querySelector(".sel__clear");
      const box = sel.querySelector(".sel__box");
      sel.appendChild(clearBtn);
      if (select.value) {
        const selectedOption = box.querySelector(
          `.sel__box__options[data-value="${select.value}"]`
        );
        if (selectedOption) {
          placeholder.textContent = selectedOption.dataset.text;
          clearBtn.style.display = "block";
        }
      } else {
        placeholder.textContent = placeholder.dataset.placeholder;
        clearBtn.style.display = "none";
        box
          .querySelectorAll(".sel__box__options")
          .forEach((el) => el.classList.remove("selected"));
      }
    }
  });
});

/* ================================
   🔹 AGENDA + FILTROS
================================ */
function normalize(str) {
  return (
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || ""
  );
}

function formatDateToMonthDay(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  if (parts.length < 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const months = [
    "Enero",
    "Febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "Oct",
    "noviembre",
    "diciembre",
  ];
  return `${months[month - 1]} ${day}`;
}

function formatTimeOnly(dateTimeStr) {
  if (!dateTimeStr) return "";
  const timePart = dateTimeStr.includes(" ")
    ? dateTimeStr.split(" ")[1]
    : dateTimeStr;
  if (!timePart) return "";
  const [hh, mm] = timePart.split(":");
  let hourNum = parseInt(hh, 10);
  const minute = mm || "00";
  const ampm = hourNum >= 12 ? "p.m." : "a.m.";
  hourNum = hourNum % 12 || 12;
  return `${hourNum}:${minute} ${ampm}`;
}

function toggleClearButton() {
  if (clearSearch) clearSearch.style.display = buscar.value ? "block" : "none";
}

function filterData() {
  const q = normalize(buscar.value.trim());
  const temaVal = tematica?.value || "";
  const prodVal = producto?.value || "";
  const sesionVal = nivel?.value || "";
  const lugarVal = lugar?.value || "";
  const diaVal = dia?.value || "";
  const dirigidoVal = dirigido?.value || "";

  // Define el orden de los días
  const diasOrden = ["jueves", "viernes", "sabado", "domingo", "lunes", "martes", "miercoles"];

  let filtered = data.filter((item) => {
    const matchNombre = normalize(item.nombre).includes(q);

    const matchTema =
      !temaVal ||
      (Array.isArray(item.tematica)
        ? item.tematica.includes(temaVal)
        : item.tematica === temaVal);

    const matchProd =
      !prodVal ||
      (Array.isArray(item.producto_esri)
        ? item.producto_esri.includes(prodVal)
        : item.producto_esri === prodVal);

    const matchSesion =
      !sesionVal ||
      (Array.isArray(item.nivel_sesion)
        ? item.nivel_sesion.includes(sesionVal)
        : item.nivel_sesion === sesionVal);

    const matchLugar =
      !lugarVal ||
      (Array.isArray(item.lugar)
        ? item.lugar.includes(lugarVal)
        : item.lugar === lugarVal);

    const matchDia =
      !diaVal ||
      (Array.isArray(item.dia)
        ? item.dia.includes(diaVal)
        : item.dia === diaVal);

    const matchDirigido =
      !dirigidoVal ||
      (Array.isArray(item.dirigido)
        ? item.dirigido.includes(dirigidoVal)
        : item.dirigido === dirigidoVal);

    return (
      matchNombre &&
      matchTema &&
      matchProd &&
      matchSesion &&
      matchLugar &&
      matchDia &&
      matchDirigido
    );
  });
  filtered.sort((a, b) => {
    const diaA = normalize(a.dia || a.fecha);
    const diaB = normalize(b.dia || b.fecha);

    const idxA = diasOrden.indexOf(diaA);
    const idxB = diasOrden.indexOf(diaB);

    if (idxA !== idxB) {
      return idxA - idxB;
    }
    const horaA = a.hora_inicio || "";
    const horaB = b.hora_inicio || "";
    return horaA.localeCompare(horaB);
  });

  return filtered;
}

function renderCards(items) {
  agenda.innerHTML = "";
  if (!items.length) {
    agenda.innerHTML = `<div class="resultados"><p>No se encontraron eventos.</p></div>`;
    return;
  }

  const colorIcono = document.body.dataset.icono || "icono-default";

  items.forEach((item) => {
    const displayDate = formatDateToMonthDay(item.fecha);
    const startTime = formatTimeOnly(item.hora_inicio);
    const endTime = formatTimeOnly(item.hora_fin);

    const tematicasHTML = (
      Array.isArray(item.tematica) ? item.tematica : [item.tematica]
    )
      .filter(Boolean)
      .map((tag) => `<li>${tag}</li>`)
      .join("");

    let detallesLinkText = "Ver detalles de la sesión";
    if (
      normalize(item.tipo_actividad) ===
      normalize("laboratorios de entrenamiento")
    ) {
      detallesLinkText = "Ver detalles del laboratorio";
    }

    const detallesHTML = item.descripcion
      ? `<div class="detalles">
           <a href="#" onclick="showMoreInfo(event, this)" data-original-text="${detallesLinkText}">
             ${detallesLinkText}
             <svg class="icon-rosado-3"><use xlink:href="#arrow"></use></svg>
           </a>
           <p class="texto">${item.descripcion}</p>
         </div>`
      : "";

    agenda.innerHTML += `
      <div class="evento">
        <div class="hora"><p>${displayDate || ""}<br />${
      startTime || ""
    }</p></div>
        <div class="info">
          <h3 class="nombre">${item.nombre}</h3>
          ${detallesHTML}
          <div class="fecha">
            <p><svg class="${colorIcono}"><use xlink:href="#clock"></use></svg>
              ${startTime || ""} - ${endTime || ""}</p>
          </div>
          <ul class="tematica">${tematicasHTML}</ul>
        </div>
      </div>
    `;
  });
}

function update() {
  if (!data.length) return;
  renderCards(filterData());
}

function applyPageFilter(allData) {
  const page = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "")
    .toLowerCase();
  const map = {
    salones: ["summit", "summit ia", "salón temático"],
    charlas: ["solución express", "sesión técnica"],
    laboratorios: ["laboratorios de entrenamiento"],
  };
  const allowed = map[page];
  if (!allowed) return allData;
  const allowedNorm = allowed.map((s) => normalize(s));
  return allData.filter((item) =>
    allowedNorm.includes(normalize(item.tipo_actividad || ""))
  );
}

function populateSelects() {
  if (!Array.isArray(data)) return;

  const sets = {
    tematica: new Set(),
    producto: new Set(),
    nivel: new Set(),
    lugar: new Set(),
    dia: new Set(),
    dirigido: new Set(),
  };

  data.forEach((item) => {
    if (item.tematica)
      (Array.isArray(item.tematica) ? item.tematica : [item.tematica]).forEach(
        (t) => sets.tematica.add(t)
      );
    if (item.producto_esri)
      (Array.isArray(item.producto_esri)
        ? item.producto_esri
        : [item.producto_esri]
      ).forEach((p) => sets.producto.add(p));
    if (item.nivel_sesion) sets.nivel.add(item.nivel_sesion);
    if (item.lugar) sets.lugar.add(item.lugar);
    if (item.dia) sets.dia.add(item.dia);
    if (item.dirigido)
      (Array.isArray(item.dirigido) ? item.dirigido : [item.dirigido]).forEach(
        (d) => sets.dirigido.add(d)
      );
  });

  Object.keys(sets).forEach((key) => {
    const sel = window[key];
    if (!sel) return;

    const current = sel.value;
    sel.innerHTML = '<option value="" disabled selected hidden></option>';

    Array.from(sets[key])
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b), "es"))
      .forEach((val) => {
        const opt = document.createElement("option");

        if (key === "dia") {
          opt.value = val.toLowerCase();
          opt.textContent =
            val.toLowerCase() === "jueves"
              ? "Día 1"
              : val.toLowerCase() === "viernes"
              ? "Día 2"
              : val;
        } else {
          opt.value = val;
          opt.textContent = val;
        }

        sel.appendChild(opt);
      });

    if (current && sets[key].has(current)) sel.value = current;

    const selContainer = sel.closest(".sel");
    if (selContainer) {
      selContainer.style.display = sel.options.length > 1 ? "block" : "none";
    }
  });
}

function showMoreInfo(e, link) {
  e.preventDefault();
  const p = link.nextElementSibling;
  if (!p) return;

  const icon = link.querySelector("svg");
  const originalText =
    link.getAttribute("data-original-text") || "Ver detalles de la sesión";

  if (p.classList.contains("open")) {
    const startHeight = p.scrollHeight;
    p.style.maxHeight = startHeight + "px";
    requestAnimationFrame(() => {
      p.style.maxHeight = "0";
      p.style.marginTop = "0";
    });
    p.classList.remove("open");
    icon.classList.remove("rotated");
    link.childNodes[0].nodeValue = originalText;

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
      p.style.transition = "";
      p.removeEventListener("transitionend", te);
    });
  }
}

function redirigir() {
  window.location.href = "index.html";
}

function resetearTemporizador() {
  clearTimeout(temporizador);
  temporizador = setTimeout(redirigir, tiempoInactividad);
}

function toggleLimpiarFiltros() {
  const hayFiltros =
    tematica?.value ||
    producto?.value ||
    nivel?.value ||
    lugar?.value ||
    dia?.value ||
    dirigido?.value;

  document.getElementById("limpiar-filtros").style.display = hayFiltros
    ? "inline-block"
    : "none";
}

/* ================================
   🔹 EVENTOS DE FILTRO
================================ */
if (buscar) {
  buscar.addEventListener("input", () => {
    update();
    toggleClearButton();
    toggleLimpiarFiltros();
  });
}
if (clearSearch) {
  clearSearch.addEventListener("click", () => {
    buscar.value = "";
    update();
    toggleClearButton();
    toggleLimpiarFiltros();
    buscar.focus();
  });
}

[tematica, producto, nivel, lugar, dia, dirigido].forEach((select) => {
  if (!select) return;
  select.addEventListener("change", () => {
    update();
    toggleLimpiarFiltros();
  });
});

/* ================================
   🔹 CARGA INICIAL
================================ */
fetch("assets/json/agenda.json")
  .then((res) => res.json())
  .then((json) => {
    data = applyPageFilter(json);
    populateSelects();
    toggleClearButton();
    toggleLimpiarFiltros();
    update();
  })
  .catch((err) => {
    agenda.innerHTML = `<div class="resultados"><p>Error al cargar la agenda.</p></div>`;
    console.error("Error cargando agenda.json:", err);
  });
