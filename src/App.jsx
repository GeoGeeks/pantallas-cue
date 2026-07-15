import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import agendaCompleta from "./data/agenda.json";
import FiltersPanel from "./components/FiltersPanel.jsx";
import SvgSprites from "./components/SvgSprites.jsx";
import { usePageTitle } from "./hooks/usePageTitle.js";

const BASE_URL = import.meta.env.BASE_URL;

const espacios = {
  salones: { icono: "easel", title: "Salón temático" },
  charlas: { icono: "mic", title: "Sesión técnica" },
  laboratorios: {
    icono: "flask",
    title: "Laboratorios de entrenamiento",
  },
};

function withBase(path) {
  return `${BASE_URL}${path}`.replace(/\/{2,}/g, "/");
}

function HomePage() {
  usePageTitle();

  return (
    <main className="main-page">
      <img
        className="logo"
        src={withBase("icons/logo-esri-ecuador.svg")}
        alt="Logo Esri Ecuador"
      />

      <img
        className="fr-inicio"
        src={withBase("images/fr-inicio.avif")}
        alt="Temáticas CUE"
      />

      <div className="content">
        <img
          src={withBase("icons/logo-cue-ecuador.svg")}
          alt="Logo CUE Ecuador"
        />

        <div className="espacios">
          <h1>Consulte la agenda del evento y planee su día</h1>
          <div className="espacios-btn">
            <Link to="salones" className="btn btn-salones">
              Salones temáticos
            </Link>
            <Link to="charlas" className="btn btn-charlas">
              Sesiones técnicas
            </Link>
            <Link to="laboratorios" className="btn btn-labs">
              Labs. Entrenamiento
            </Link>
          </div>
        </div>

        <div className="awp">
          <img src={withBase("images/app-qr.avif")} alt="app-qr" />
          <p>
            Personalice su agenda y planee su ruta desde nuestra aplicación
            móvil.
          </p>
        </div>
      </div>
    </main>
  );
}

function AgendaPage({ espacio, icono, title }) {
  usePageTitle();

  const eventos = agendaCompleta
    .filter((item) => item.tipo_actividad === title)
    .sort((a, b) => new Date(a.hora_inicio) - new Date(b.hora_inicio));

  return (
    <main className="agenda">
      <div className={`banner-segmento ${espacio}`}>
        <div className="header-nav">
          <h1>{title}</h1>
          <Link to="/">
            <svg>
              <use href="#arrow" />
            </svg>
          </Link>
        </div>

        <FiltersPanel icono={icono} segmento={espacio} />
      </div>

      <div className="utilities">
        Viernes 02
      </div>

      <div className={`content-segmento ${espacio}`}>
        <div id="agenda" className={`agenda ${espacio}`}>
          {eventos.map((item) => (
            <div className="evento" key={`${item.nombre}-${item.hora_inicio}`}>
              <div className="hora">
                <p>{item.hora_inicio}</p>
              </div>
              <div className="info">
                <h3 className="nombre">{item.nombre}</h3>
                <p>{item.lugar}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="footer-section">
          <p>
            Personalice su agenda y planee su ruta desde nuestra aplicación
            móvil.
          </p>

          <svg className={icono}>
            <use href="#logo" />
          </svg>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <SvgSprites />
      <BrowserRouter basename={BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="salones"
            element={<AgendaPage espacio="salones" {...espacios.salones} />}
          />
          <Route
            path="charlas"
            element={<AgendaPage espacio="charlas" {...espacios.charlas} />}
          />
          <Route
            path="laboratorios"
            element={
              <AgendaPage espacio="laboratorios" {...espacios.laboratorios} />
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}
