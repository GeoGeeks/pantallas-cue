export default function FiltersPanel({ icono, segmento, showDia = false }) {
  return (
    <div className={`filtros ${segmento}`}>
      <div className="sel lugar">
        <select id="lugar" name="lugar" data-placeholder="Piso - Salón" />
        <svg className={icono}>
          <use href="#arrow" />
        </svg>
      </div>

      {showDia ? (
        <div className="sel dia">
          <select id="dia" name="dia" data-placeholder="Día" />
          <svg className="sel__arrow">
            <use href="#arrow" />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
