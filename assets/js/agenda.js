let data = [];
let temporizador;
let diaSeleccionado = "";

const agenda = document.getElementById("agenda");
const buscar = document.getElementById("buscar");
const closeSearchBtn = document.getElementById("clear-buscar");
const clearTextBtn = document.getElementById("limpiar-busqueda");
const tematica = document.getElementById("tematica");
const producto = document.getElementById("producto");
const nivel = document.getElementById("nivel");
const lugar = document.getElementById("lugar");
const dirigido = document.getElementById("dirigido");
const verMapa = document.getElementById("ver-mapa");
const modal = document.getElementById("mapaModal");
const mapaImg = document.getElementById("mapa-img");
const closeBtn = document.querySelector(".close");
const cerrarFiltrosBtn = document.getElementById("cerrar-filtros");
const limpiarFiltrosBtn = document.getElementById("limpiar-filtros");
const sectionUtilities = document.querySelector(".section-utilities");
const filtrosPanel = document.querySelector(".filtros");
const toggleBuscarBtn = document.getElementById("toggle-buscar");
const toggleFiltrosBtn = document.getElementById("toggle-filtros");
let isSearchActive = false;
let isFiltersOpen = false;

const tiempoInactividad = 3 * 30 * 1000;

if (toggleBuscarBtn) {
  toggleBuscarBtn.addEventListener("click", toggleSearchMode);
}
if (buscar && sectionUtilities) {
  buscar.addEventListener("focus", activateSearchMode);
  buscar.addEventListener("click", activateSearchMode);
}
if (toggleFiltrosBtn) {
  toggleFiltrosBtn.addEventListener("click", toggleFiltersMode);
}
if (cerrarFiltrosBtn) {
  cerrarFiltrosBtn.addEventListener("click", resetUIState);
}

document.addEventListener("click", (event) => {
  if (
    (isSearchActive || isFiltersOpen) &&
    sectionUtilities &&
    !sectionUtilities.contains(event.target)
  ) {
    resetUIState();
  }
});

updateUIState();

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
      `.sel__box__options[data-value="${select.value}"]`,
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
        `.sel__box__options[data-value="${select.value}"]`,
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
          `.sel__box__options[data-value="${select.value}"]`,
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

if (limpiarFiltrosBtn) {
  limpiarFiltrosBtn.addEventListener("click", () => {
    [tematica, producto, nivel, lugar, dirigido].forEach((sel) => {
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

    const primerDia = document.querySelector("#dias-container li");
    if (primerDia) {
      document
        .querySelectorAll("#dias-container li")
        .forEach((el) => el.classList.remove("active"));

      primerDia.classList.add("active");
      diaSeleccionado = primerDia.dataset.value;
    }

    update();
    toggleClearButton();
    toggleLimpiarFiltros();
  });
}

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
          `.sel__box__options[data-value="${select.value}"]`,
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

function parseFechaSafe(fecha) {
  if (!fecha) return null;

  const partes = fecha.split(/[-/]/);
  if (partes.length < 3) return null;

  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10) - 1;
  const day = parseInt(partes[2], 10);

  return new Date(year, month, day);
}

function getDiaDesdeFecha(fecha) {
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const d = parseFechaSafe(fecha);
  if (!d) return "";

  return dias[d.getDay()];
}

function toggleClearButton() {
  if (!buscar) return;
  if (closeSearchBtn) {
    closeSearchBtn.style.display = isSearchActive ? "block" : "none";
    closeSearchBtn.title = "Cerrar búsqueda";
    closeSearchBtn.setAttribute("aria-label", "Cerrar búsqueda");
  }
  if (clearTextBtn) {
    clearTextBtn.style.display = buscar.value ? "block" : "none";
  }
}

function filterData() {
  const q = normalize(buscar.value.trim());
  const temaVal = tematica?.value || "";
  const prodVal = producto?.value || "";
  const sesionVal = nivel?.value || "";
  const lugarVal = lugar?.value || "";
  const dirigidoVal = dirigido?.value || "";

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

    const diaItem = getDiaDesdeFecha(item.fecha);
    const matchDia = diaItem === diaSeleccionado;

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
    const dateA = new Date(a.hora_inicio);
    const dateB = new Date(b.hora_inicio);

    return dateA - dateB;
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

    /* ${displayDate || ""}<br /> */

    agenda.innerHTML += `
      <div class="evento">
        <div class="hora"><p>${startTime || ""}</p></div>
        <div class="info">
          <h3 class="nombre">${item.nombre}</h3>
          ${detallesHTML}
          <div class="fecha">
            <p><svg class="${colorIcono}"><use xlink:href="#clock"></use></svg>
              ${startTime || ""} - ${endTime || ""}
              <br><svg class="${colorIcono}"><use xlink:href="#floor"></use></svg>
              ${item.lugar}</p>
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
  const matchesByPage = {
    salones: (tipo) =>
      tipo.includes("summit") || (tipo.includes("sal") && tipo.includes("tem")),
    charlas: (tipo) =>
      tipo.includes("soluc") || (tipo.includes("ses") && tipo.includes("tec")),
    laboratorios: (tipo) => tipo.includes("laborator"),
  };
  const matcher = matchesByPage[page];
  if (!matcher) return allData;
  return allData.filter((item) =>
    matcher(normalize(item.tipo_actividad || "")),
  );
}

function populateSelects() {
  if (!Array.isArray(data)) return;

  const sets = {
    tematica: new Set(),
    producto: new Set(),
    nivel: new Set(),
    lugar: new Set(),
    dirigido: new Set(),
  };

  data.forEach((item) => {
    if (item.tematica)
      (Array.isArray(item.tematica) ? item.tematica : [item.tematica]).forEach(
        (t) => sets.tematica.add(t),
      );
    if (item.producto_esri)
      (Array.isArray(item.producto_esri)
        ? item.producto_esri
        : [item.producto_esri]
      ).forEach((p) => sets.producto.add(p));
    if (item.nivel_sesion) sets.nivel.add(item.nivel_sesion);
    if (item.lugar) sets.lugar.add(item.lugar);
    if (item.dirigido)
      (Array.isArray(item.dirigido) ? item.dirigido : [item.dirigido]).forEach(
        (d) => sets.dirigido.add(d),
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
        opt.value = val;
        opt.textContent = val;

        sel.appendChild(opt);
      });

    if (current && sets[key].has(current)) sel.value = current;

    const selContainer = sel.closest(".sel");
    if (selContainer) {
      selContainer.style.display = sel.options.length > 1 ? "block" : "none";
    }
  });
}

function renderDias() {
  const container = document.querySelector("#dias-container ul");
  if (!container) return;

  container.innerHTML = "";

  const diasUnicos = new Set();
  const fechasPorDia = {};

  data.forEach((item) => {
    if (!item.fecha) return;

    const diaReal = getDiaDesdeFecha(item.fecha);

    diasUnicos.add(diaReal);

    if (!fechasPorDia[diaReal]) {
      fechasPorDia[diaReal] = item.fecha;
    }
  });

  const diasOrdenados = Array.from(diasUnicos).sort((a, b) => {
    return parseFechaSafe(fechasPorDia[a]) - parseFechaSafe(fechasPorDia[b]);
  });

  diasOrdenados.forEach((dia, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.innerHTML = `${dia}&nbsp;`;

    const fecha = formatDateToMonthDay(fechasPorDia[dia]);

    li.appendChild(span);
    li.append(fecha);

    li.dataset.value = dia;

    if (index === 0) {
      li.classList.add("active");
      diaSeleccionado = dia;
    }

    li.addEventListener("click", () => {
      document
        .querySelectorAll("#dias-container li")
        .forEach((el) => el.classList.remove("active"));

      li.classList.add("active");
      diaSeleccionado = dia;

      update();
      if (agenda) agenda.scrollTop = 0;
      toggleLimpiarFiltros();
    });

    container.appendChild(li);
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
    dirigido?.value;

  if (limpiarFiltrosBtn) {
    limpiarFiltrosBtn.style.display = hayFiltros ? "inline-block" : "none";
  }
}

function updateUIState() {
  if (!sectionUtilities || !filtrosPanel) return;

  sectionUtilities.classList.toggle("search-active", isSearchActive);
  sectionUtilities.classList.toggle("filters-open", isFiltersOpen);
  filtrosPanel.classList.toggle("open", isFiltersOpen);

  if (toggleBuscarBtn) {
    toggleBuscarBtn.title = isSearchActive ? "Cerrar búsqueda" : "Buscar";
    toggleBuscarBtn.setAttribute(
      "aria-label",
      isSearchActive ? "Cerrar búsqueda" : "Abrir búsqueda",
    );
  }
  if (toggleFiltrosBtn) {
    toggleFiltrosBtn.title = "Filtros";
    toggleFiltrosBtn.setAttribute("aria-label", "Abrir filtros");
  }
}

function resetUIState() {
  isSearchActive = false;
  isFiltersOpen = false;
  updateUIState();
  toggleClearButton();
}

function activateSearchMode() {
  if (isFiltersOpen) {
    isFiltersOpen = false;
  }
  isSearchActive = true;
  updateUIState();
  toggleClearButton();
  if (buscar) buscar.focus();
}

function toggleSearchMode() {
  if (isSearchActive) {
    resetUIState();
    return;
  }
  activateSearchMode();
}

function toggleFiltersMode() {
  if (isFiltersOpen) {
    resetUIState();
    return;
  }
  isSearchActive = false;
  isFiltersOpen = true;
  updateUIState();
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
  buscar.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (buscar.value) {
        buscar.value = "";
        update();
      } else {
        resetUIState();
        buscar.blur();
      }
      toggleClearButton();
      toggleLimpiarFiltros();
    }
  });
}
if (clearTextBtn) {
  clearTextBtn.addEventListener("click", () => {
    if (!buscar) return;
    buscar.value = "";
    update();
    toggleClearButton();
    toggleLimpiarFiltros();
    buscar.focus();
  });
}
if (closeSearchBtn) {
  closeSearchBtn.addEventListener("click", () => {
    resetUIState();
    if (buscar) buscar.blur();
  });
}

[tematica, producto, nivel, lugar, dirigido].forEach((select) => {
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
    renderDias();
    toggleClearButton();
    toggleLimpiarFiltros();
    update();
  })
  .catch((err) => {
    agenda.innerHTML = `<div class="resultados"><p>Error al cargar la agenda.</p></div>`;
    console.error("Error cargando agenda.json:", err);
  });
