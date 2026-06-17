# Pantallas CUE - Astro

Migración del monolito a **Astro** con despliegue automático en GitHub Pages.

## 🚀 Comandos de Desarrollo

- `pnpm install` : Instala dependencias.
- `pnpm dev` : Inicia el servidor local.
- `pnpm build` : Genera los archivos estáticos en `./dist/`.
- `pnpm preview` : Previsualiza el build de producción.

## ⚙️ Despliegue

- **CI/CD**: Despliegue automático vía GitHub Actions (`.github/workflows/deploy.yml`).
- **Configuración**: Configurado con `base: '/pantallas-cue/'` en `astro.config.mjs`.

## 📁 Estructura

- `/src/pages`: Enrutamiento principal.
- `/src/components`: Componentes reutilizables.
- `/public`: Assets estáticos.
