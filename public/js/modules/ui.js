export const UI = {
  renderCards(items) {
    const container = document.getElementById("agenda");
    if (!container) return;
    container.innerHTML = items.map(item => `
      <div class="evento">
        <div class="hora"><p>${item.hora_inicio}</p></div>
        <div class="info">
          <h3 class="nombre">${item.nombre}</h3>
          <p>${item.lugar}</p>
        </div>
      </div>
    `).join("");
  }
};
