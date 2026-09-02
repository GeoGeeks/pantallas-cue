import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AGENDA_SECTIONS, BASE_URL, withBase } from "./config/agenda.js";
import { usePageTitle } from "./hooks/usePageTitle.js";
import { useIdleRedirect } from "./hooks/useIdleRedirect.js";
import SvgSprites from "./components/SvgSprites.jsx";
import AgendaPage from "./AgendaPage.jsx";

function HomePage() {
  usePageTitle();

  return (
    <main className="main-page">
      <svg className="logo-esri">
        <use href="#logo-esri-panama" />
      </svg>

      <div className="content">
        <svg className="logo-cue">
          <use href="#logo-cue" />
        </svg>

        <div className="espacios-inicio">
          <h2>Consulte la agenda de eventos y planee su día</h2>
          <div className="espacios-btn">
            <Link to="salones" className="btn btn-salones">
              Salones temáticos
            </Link>
            <Link to="laboratorios" className="btn btn-labs">
              Labs. entrenamiento
            </Link>
          </div>
        </div>

        <div className="awp">
          <img
            src={withBase("images/app-qr.webp")}
            alt="app-qr"
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
          />
          <p>
            Personalice su agende y planee su ruta
            <br />
            desde nuestra aplicación móvil.
          </p>
        </div>
      </div>
    </main>
  );
}

function AppRoutes() {
  useIdleRedirect();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {Object.entries(AGENDA_SECTIONS).map(([espacio, section]) => (
        <Route
          key={espacio}
          path={espacio}
          element={<AgendaPage key={espacio} espacio={espacio} {...section} />}
        />
      ))}
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <SvgSprites />
      <BrowserRouter basename={BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}
