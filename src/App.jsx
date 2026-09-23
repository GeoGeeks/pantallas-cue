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
        <use href="#logo-esri-colombia" />
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
            <Link to="charlas" className="btn btn-charlas">
              Charlas técnicas
            </Link>
            <Link to="laboratorios" className="btn btn-labs">
              Labs. entrenamiento
            </Link>
          </div>
        </div>

        <div className="awp">
          <p>
            Personalice su agende y planee su ruta
            <br />
            desde nuestra aplicación móvil.
          </p>
          <div className="qr-row">
            <div className="qr-item">
              <img
                src={withBase("images/qr-android.webp")}
                alt="Código QR para descargar la app en Google Play"
                loading="lazy"
                decoding="async"
                width={200}
                height={200}
              />
              <img
                className="store-badge"
                src={withBase("images/badge-google-play.webp")}
                alt="Disponible en Google Play"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="qr-item">
              <img
                src={withBase("images/qr-ios.webp")}
                alt="Código QR para descargar la app en App Store"
                loading="lazy"
                decoding="async"
                width={200}
                height={200}
              />
              <img
                className="store-badge"
                src={withBase("images/badge-app-store.webp")}
                alt="Disponible en App Store"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
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
