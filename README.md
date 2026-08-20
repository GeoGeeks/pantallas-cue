# Pantallas CUE - React

Aplicacion de agenda de evento migrada a **React + Vite**.

## Características

- React Router para navegación SPA

## Comandos de desarrollo

- `pnpm install`: instala dependencias.
- `pnpm dev`: inicia el servidor local (proxea `/api/agenda` hacia `cue.esri.ec`, ver `vite.config.js`).
- `pnpm build`: genera los archivos estaticos en `./dist/`.
- `pnpm preview`: previsualiza el build de produccion.

## Despliegue: IIS en `https://geoapps.esri.co/cue-2026-agenda/`

El sitio corre como una aplicación IIS bajo `geoapps.esri.co`. El frontend es
estático (`dist/`); las llamadas a la API de agenda pasan por un proxy propio
(`server/`) que corre aparte, como servicio de Windows, para no exponer el
token de la API en el navegador.

### 1. Frontend estático

- **Base path**: `base: "/cue-2026-agenda/"` en `vite.config.js` (fijo; puede
  sobreescribirse con la env var `VITE_BASE_PATH` si el path cambia).
- `pnpm build` genera `dist/`. Copiar el **contenido** de `dist/` (no la
  carpeta) a la raíz física de la aplicación IIS `cue-2026-agenda`.
- `dist/web.config` (copiado automáticamente desde `public/web.config` en el
  build) trae:
  - El fallback de rutas SPA: cualquier URL que no sea un archivo real se
    resuelve con `index.html` (necesario porque usamos `BrowserRouter`, sin
    esto entrar directo a `/cue-2026-agenda/salones` o refrescar da 404).
  - El reverse proxy de `api/agenda/*` hacia el servicio Node local (paso 2).
  - MIME types para `.avif`, `.woff2`, `.webmanifest`.

### 2. Proxy de la API (`server/`) — servicio de Windows con NSSM

Reemplaza a la antigua Vercel Function. Vive en `server/`, no depende del
resto del proyecto (tiene su propio `package.json`).

En el servidor:

```powershell
cd server
npm install --omit=dev
```

Registrar el servicio con NSSM:

```powershell
nssm install CueAgendaProxy "C:\Program Files\nodejs\node.exe" "C:\ruta\a\cue-2026-agenda\server\index.js"
nssm set CueAgendaProxy AppDirectory "C:\ruta\a\cue-2026-agenda\server"
nssm set CueAgendaProxy AppEnvironmentExtra API_TARGET=https://cue.esri.ec API_PATH_PREFIX=/rest/v1/ecuador API_TOKEN=TU_TOKEN_AQUI PORT=3001
nssm set CueAgendaProxy AppStdout "C:\ruta\a\cue-2026-agenda\server\logs\out.log"
nssm set CueAgendaProxy AppStderr "C:\ruta\a\cue-2026-agenda\server\logs\err.log"
nssm set CueAgendaProxy Start SERVICE_AUTO_START
nssm start CueAgendaProxy
```

El proxy escucha solo en `127.0.0.1:3001` (no expuesto fuera del servidor).
Verificar que está vivo con `http://127.0.0.1:3001/healthz` desde el propio
servidor.

### 3. IIS: URL Rewrite + Application Request Routing (ARR)

Requisitos, una sola vez a nivel de servidor:

- Instalar el módulo **URL Rewrite**.
- Instalar **Application Request Routing (ARR)** y habilitar el proxy:
  IIS Manager → nodo del servidor → *Application Request Routing Cache* →
  *Server Proxy Settings...* → check **Enable proxy**.

Con eso, el `web.config` del sitio ya define las reglas de rewrite/proxy —
no hace falta tocar nada más en IIS Manager para el ruteo.

### 4. Variables de entorno del proxy

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_TARGET` | Host upstream | `https://cue.esri.ec` |
| `API_PATH_PREFIX` | Prefijo de ruta upstream | `/rest/v1/ecuador` |
| `API_TOKEN` (o `AUTH_TOKEN`) | Bearer token del upstream | — |
| `PORT` | Puerto local del proxy | `3001` |

Si `API_TOKEN` no está configurado y el upstream requiere autenticación, el
frontend cae de forma silenciosa a una agenda de ejemplo hardcodeada
(`src/services/agendaApi.js`, `FALLBACK_AGENDA`) en vez de mostrar error —
confirmar el token antes de dar el deploy por bueno.

## Estructura

- `/src/App.jsx`: enrutamiento con React Router.
- `/src/components`: componentes React reutilizables (AgendaFooter, FiltersPanel, SvgSprites).
- `/src/data/`: datos de agenda en JSON.
- `/src/styles.css`: estilos globales (importa desde `/public/styles/`).
- `/public/`: assets estaticos (iconos, imágenes, estilos CSS) + `web.config` para IIS.
- `/server/`: proxy standalone hacia la API de agenda (servicio de Windows vía NSSM).
- `vite.config.js`: configuración de Vite con soporte para React.
