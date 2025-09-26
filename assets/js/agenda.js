let data = [];

const agenda = document.getElementById("agenda");
const buscar = document.getElementById("buscar");
const clearSearch = document.getElementById("clear-buscar");
const tematica = document.getElementById("tematica");
const producto = document.getElementById("producto");
const nivel = document.getElementById("nivel");
const lugar = document.getElementById("lugar");
const dia = document.getElementById("dia");
const dirigido = document.getElementById("dirigido");
/* const lugarLinkDiv = document.getElementById("lugar-link");

// Modadl Imagen Piso - Salon
const modal = document.getElementById("modal-lugar");
const modalImg = document.getElementById("modal-lugar-img");
const caption = document.getElementById("modal-caption");
const closeBtn = modal.querySelector(".modal-close");

function updateLugarLink() {
  lugarLinkDiv.innerHTML = "";

  const valor = lugar.value;
  if (!valor) return;
  const imagenPath = encodeURI(`assets/images/Piso-Salon/${valor}.avif`);
  modalImg.src = imagenPath;

  console.log("Ruta de la imagen para el modal:", imagenPath);

  const enlace = document.createElement("a");
  enlace.href = "#";
  enlace.textContent = "Ver imagen del lugar";
  enlace.onclick = function (e) {
    e.preventDefault();
    modal.style.display = "block";
    modalImg.src = imagenPath;
    caption.textContent = `Plano del lugar: Piso-Salon ${valor}`;
  };

  lugarLinkDiv.appendChild(enlace);
}

closeBtn.onclick = () => (modal.style.display = "none");
modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

lugar.addEventListener("change", updateLugarLink);
updateLugarLink(); */

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

  return data.filter((item) => {
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
      normalize("laboratorio de entrenamiento")
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
    salones: ["summit", "summit ia", "salón temático", "salon tematico"],
    charlas: ["solución express", "sesión técnica"],
    laboratorios: ["laboratorio de entrenamiento"],
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

/* ================================
   🔹 EVENTOS DE FILTRO
================================ */
if (buscar) {
  buscar.addEventListener("input", () => {
    update();
    toggleClearButton();
  });
}
if (clearSearch) {
  clearSearch.addEventListener("click", () => {
    buscar.value = "";
    update();
    toggleClearButton();
    buscar.focus();
  });
}

[tematica, producto, nivel, lugar, dia, dirigido].forEach((select) => {
  if (!select) return;
  select.addEventListener("change", update);
});

/* ================================
   🔹 CARGA INICIAL
================================ */
fetch("/assets/json/agenda.json")
  .then((res) => res.json())
  .then((json) => {
    data = applyPageFilter(json);
    populateSelects();
    toggleClearButton();
    update();
  })
  .catch((err) => {
    agenda.innerHTML = `<div class="resultados"><p>Error al cargar la agenda.</p></div>`;
    console.error("Error cargando agenda.json:", err);
  });
