// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

const MENU_ITEMS = [
  { label: "Salones temáticos", path: "/salones" },
  { label: "Charlas técnicas", path: "/charlas" },
  { label: "Laboratorios de entrenamiento", path: "/laboratorios" },
];

export default function Navbar({ title, espacio }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {menuOpen && (
        <div className="menu-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}

      <div className={`banner-segmento ${espacio}`}>
        <div className={`header-nav ${menuOpen ? "is-open" : "is-closed"}`}>
          <h1>{menuOpen ? "Espacios" : title}</h1>

          <button
            onClick={toggleMenu}
            className={`menu-button ${menuOpen ? "open" : ""}`}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <svg>
              <use href={menuOpen ? "#icon-close" : "#icon-menu"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="menu-dropdown">
            {MENU_ITEMS.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                onClick={closeMenu}
                className={`menu-item ${item.label === title ? "selected" : ""}`}
              >
                <span>{item.label}</span>
                <svg className="arrow-icon">
                  <use href="#icon-arrow" />
                </svg>
              </Link>
            ))}
            <svg className="menu-footer">
              <use href="#logo-esri-ecuador" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
