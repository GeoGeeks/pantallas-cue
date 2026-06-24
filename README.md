# Pantallas CUE - React

Aplicacion de agenda de evento migrada a **React + Vite**.

## Características

- React Router para navegación SPA

## Comandos de desarrollo

- `pnpm install`: instala dependencias.
- `pnpm dev`: inicia el servidor local.
- `pnpm build`: genera los archivos estaticos en `./dist/`.
- `pnpm preview`: previsualiza el build de produccion.

## Despliegue

- **Configuracion**: `base: "/pantallas-cue/"` en `vite.config.js`.
- **SPA Redirect**: `public/404.html` redirige todas las rutas a `index.html` para funcionamiento correcto.

## Estructura

- `/src/App.jsx`: enrutamiento con React Router.
- `/src/components`: componentes React reutilizables (AgendaFooter, FiltersPanel, SvgSprites).
- `/src/data/`: datos de agenda en JSON.
- `/src/styles.css`: estilos globales (importa desde `/public/styles/`).
- `/public/`: assets estaticos (iconos, imágenes, estilos CSS).
- `vite.config.js`: configuración de Vite con soporte para React.
