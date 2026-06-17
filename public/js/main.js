import { Engine } from "./modules/engine.js";
import { UI } from "./modules/ui.js";

function init() {
  const container = document.getElementById("agenda-container");
  if (!container) return;

  const rawAttr = container.dataset.eventos;
  const decoded = rawAttr ? decodeURIComponent(rawAttr) : "";
  const safe = (!decoded || decoded.trim() === "" || decoded.trim() === "undefined") ? "[]" : decoded;
  let data = [];
  try {
    data = JSON.parse(safe);
  } catch (e) {
    console.error("Failed to parse eventos data", e, safe);
    data = [];
  }

  UI.renderCards(data);

  const buscarInput = document.getElementById("buscar");
  if (buscarInput) {
    buscarInput.addEventListener("input", (e) => {
      const target = e.target;
      const filtered = Engine.filter(data, { query: target.value });
      UI.renderCards(filtered);
    });
  }
}

init();
