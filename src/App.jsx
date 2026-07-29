// src/App.jsx
import React, { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { obtenerDiasUnicos } from "./utils/agendaUtils.js";
import { usePageTitle } from "./hooks/usePageTitle.js";
import agenda from "./data/agenda.json";
import SvgSprites from "./components/SvgSprites.jsx";
import Navbar from "./components/Navbar.jsx";
import Utilities from "./components/Utilities.jsx";
import FiltersPanel from "./components/FiltersPanel.jsx";
import Actividades from "./components/Actividades.jsx";

const BASE_URL = import.meta.env.BASE_URL;

const espacios = {
  salones: { icono: "easel", title: "Salones temáticos" },
  charlas: { icono: "mic", title: "Charlas técnicas" },
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
      <svg className="logo-esri">
        <use href="#logo-esri-ecuador" />
      </svg>

      <img
        className="fr-inicio"
        src={withBase("images/fr-inicio.avif")}
        alt="Temáticas CUE"
      />

      <div className="content">
        <svg className="logo-cue">
          <use href="#logo-cue" />
        </svg>

        <div className="espacios-inicio">
          <h2>Consulte la agenda del evento y planeé su día</h2>
          <div className="espacios-btn">
            <Link to="salones" className="btn btn-salones">
              Salones temáticos
            </Link>
            <Link to="charlas" className="btn btn-charlas">
              Charlas técnicas
            </Link>
            <Link to="laboratorios" className="btn btn-labs">
              Labs. Entrenamiento
            </Link>
          </div>
        </div>

        <div className="awp">
          <img src={withBase("images/app-qr.avif")} alt="app-qr" />
          <p>
            Personalice su agenda y planee su ruta
            <br />
            desde nuestra aplicación móvil.
          </p>
        </div>
      </div>
    </main>
  );
}

function AgendaPage({ espacio, icono, title, filtro }) {
  usePageTitle();

  const listaDias = useMemo(() => obtenerDiasUnicos(agenda), []);

  const [diaSeleccionado, setDiaSeleccionado] = useState(
    () => listaDias[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState([]);

  const gruposFiltros = useMemo(() => {
    const tipoActual = filtro || title;
    const tematicasSet = new Set();
    const nivelesSet = new Set();

    agenda.forEach((item) => {
      if (item.tipo_actividad === tipoActual) {
        if (Array.isArray(item.tematicas)) {
          item.tematicas.forEach((t) => t && tematicasSet.add(t));
        } else if (item.tematica) {
          tematicasSet.add(item.tematica);
        }

        if (item.nivel) {
          nivelesSet.add(item.nivel);
        }
      }
    });

    const config = [
      {
        id: "tematica",
        label: "Temáticas",
        opciones: Array.from(tematicasSet),
      },
    ];

    if (nivelesSet.size > 0) {
      config.push({
        id: "nivel",
        label: "Nivel",
        opciones: Array.from(nivelesSet),
      });
    }

    return config;
  }, [filtro, title]);

  const handleAddFiltro = (nuevoFiltro) => {
    const existe = filtrosActivos.some(
      (f) => f.grupoId === nuevoFiltro.grupoId && f.valor === nuevoFiltro.valor,
    );
    if (!existe) {
      setFiltrosActivos([...filtrosActivos, nuevoFiltro]);
    }
  };

  const handleRemoveFiltro = (filtroToRemove) => {
    setFiltrosActivos(
      filtrosActivos.filter(
        (f) =>
          !(
            f.grupoId === filtroToRemove.grupoId &&
            f.valor === filtroToRemove.valor
          ),
      ),
    );
  };

  const handleLimpiarFiltros = () => {
    setFiltrosActivos([]);
  };

  const eventos = agenda
    .filter((item) => {
      const matchTipo = item.tipo_actividad === (filtro || title);
      const matchDia = item.fecha === diaSeleccionado;
      const matchSearch =
        item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.lugar &&
          item.lugar.toLowerCase().includes(searchQuery.toLowerCase()));

      const itemTematicas = Array.isArray(item.tematicas)
        ? item.tematicas
        : item.tematica
          ? [item.tematica]
          : [];

      const matchFiltros =
        filtrosActivos.length === 0 ||
        filtrosActivos.some((f) => {
          if (f.grupoId === "tematica") return itemTematicas.includes(f.valor);
          if (f.grupoId === "nivel") return item.nivel === f.valor;
          return true;
        });

      return matchTipo && matchDia && matchSearch && matchFiltros;
    })
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <main className={`espacios ${espacio}`}>
      <Navbar title={title} espacio={espacio} />

      <Utilities
        dias={listaDias}
        diaSeleccionado={diaSeleccionado}
        onSelectDia={setDiaSeleccionado}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        espacio={espacio}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {(showFilters || filtrosActivos.length > 0) && (
        <FiltersPanel
          gruposFiltros={gruposFiltros}
          filtrosActivos={filtrosActivos}
          onAddFiltro={handleAddFiltro}
          onRemoveFiltro={handleRemoveFiltro}
          onLimpiarFiltros={handleLimpiarFiltros}
          onClose={() => setShowFilters(false)}
          espacio={espacio}
          isPanelOpen={showFilters}
        />
      )}

      <Actividades eventos={eventos} espacio={espacio} />

      <div className="footer-section">
        <p>
          Personalice su agenda y planeé su ruta desde nuestra aplicación móvil.
        </p>

        <svg className="logo-cue">
          <use href="#logo-cue" />
        </svg>
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
