# Pantallas CUE - React

Aplicacion de agenda de evento migrada a **React + Vite**.

## Características

- React Router para navegación SPA

## Comandos de desarrollo

- `pnpm install`: instala dependencias.
- `pnpm dev`: inicia el servidor local (proxea `/api/agenda` hacia `cue.esri.pa`, ver `vite.config.js`).
- `pnpm dev -- --host`: lo mismo, accesible desde otro equipo de la red
  (`http://<ip-del-equipo>:5173/cue-2026-agenda/` — el base path hace falta).
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
nssm set CueAgendaProxy AppEnvironmentExtra API_TARGET=https://cue.esri.pa API_PATH_PREFIX=/rest/v1/panama API_TOKEN=TU_TOKEN_AQUI PORT=3001
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
| `API_TARGET` | Host upstream | `https://cue.esri.pa` |
| `API_PATH_PREFIX` | Prefijo de ruta upstream | `/rest/v1/panama` |
| `API_TOKEN` (o `AUTH_TOKEN`) | Bearer token del upstream | — |
| `PORT` | Puerto local del proxy | `3001` |

Si `API_TOKEN` no está configurado y el upstream requiere autenticación, el
frontend cae de forma silenciosa a una agenda de ejemplo hardcodeada
(`src/services/agendaApi.js`, `FALLBACK_AGENDA`) en vez de mostrar error —
confirmar el token antes de dar el deploy por bueno.

### 4.1 El token caduca — cómo se obtiene y cómo se renueva

`API_TOKEN` es un **JWT de servicio**, no una API key: nace con fecha de
caducidad dentro y **el proxy no lo renueva** (lo lee una vez de la variable de
entorno). Cuando vence, el front cae al respaldo de ejemplo **sin avisar**.

Se emite con el endpoint de acceso del panel, con un correo dado de alta en
`administradores` de **la base de ese país**:

```bash
curl -X POST https://cue.esri.pa/rest/v1/panama/usuarios/acceso-admin \
  -H "Content-Type: application/json" -d '{"email":"<correo de admin>"}'
# → { "data": { "accessToken": "..." } }
```

🔴 **El token queda atado al país** (claim `pais`). Uno de Ecuador contra
`/rest/v1/panama` responde **403 «El token no corresponde al país de esta
ruta»** — medido el 2026-09-01. Para Panamá hace falta uno emitido con
`.../v1/panama/...`.

Para saber cuánto dura, decodificar el payload (no hace falta el secreto):

```bash
python3 -c "import base64,json,sys,datetime as dt; p=sys.argv[1].split('.')[1]; \
c=json.loads(base64.urlsafe_b64decode(p+'=='*(-len(p)%4))); \
print('pais', c['pais'], '| vida', (c['exp']-c['iat'])/3600, 'h | caduca', \
dt.datetime.fromtimestamp(c['exp']))" "<token>"
```

⚠️ **La vigencia la fija `JWT_EXPIRES` del BACKEND**, no este repo. Medido el
2026-09-01, producción emitía tokens de **48 h** aunque el default del propio
backend (`env.validation.ts`) y su `.env.example` declaran **`90d`**: alguien la
bajó a `2d`. Y es **global** — el mismo `JwtModule` firma las sesiones de los
asistentes de la PWA, así que subirla las alarga a todas.

🔴 **Al cambiar `JWT_EXPIRES` hay que REEMITIR el token.** Un JWT lleva su `exp`
firmado dentro: subir la variable **no alarga los tokens ya emitidos**. La
secuencia completa es:

1. cambiar `JWT_EXPIRES` en el backend **y reiniciarlo**
2. **emitir un token nuevo** con el `curl` de arriba
3. comprobar con el decodificador que la vida es la esperada
4. ponerlo en `API_TOKEN` del servicio y `nssm restart CueAgendaProxy`
5. verificar de punta a punta (§4.2)

Saltarse el paso 2 es el error fácil: la variable queda bien y el kiosco sigue
caducando el mismo día.

### 4.2 Verificar que el despliegue quedó bien

```bash
curl -s https://geoapps.esri.co/cue-2026-agenda/api/agenda/charlas/ | head -c 200
```

- **200 con una lista** → correcto.
- **401** con `"path":"/v1/ecuador/..."` → el proxy apunta a Ecuador
  (`API_PATH_PREFIX`) **y** el token está vencido: eso es lo que había el
  2026-09-01.
- ⚠️ **No sirve mirar solo el código HTTP** de un asset o una ruta: IIS responde
  **200 con el HTML del SPA** a todo lo que no existe. Hay que mirar el cuerpo.

## Panamá (2026-09-01)

Esta aplicación sirve el evento de **Panamá**. Lo que eso implica y no es obvio:

- **Los valores por defecto del proxy apuntan a Panamá** (`server/index.js` y
  `vite.config.js`): `https://cue.esri.pa` + `/rest/v1/panama`. En el servidor
  mandan las variables de entorno, así que si el evento cambia de país basta con
  cambiarlas — no hay que tocar código.
- **En local el prefijo es distinto**: el backend de desarrollo expone
  `/v1/panama` **sin** `/rest`. Por eso `.env` (no versionado) lleva
  `VITE_API_PROXY_PATH=/v1/panama` y `VITE_API_PROXY_TARGET=http://localhost:3001`.
- **Solo hay dos secciones: Salones y Laboratorios.** Charlas técnicas se retiró
  (Panamá no las tiene). Ver `src/config/agenda.js`, que explica por qué Salones
  se define por **prefijo** (`Salón…`) y no por una lista de tipos.
- **Los mapas de piso se resuelven por el nombre del lugar**, tal cual llega en
  `location` desde el API: `public/images/Piso-Salon/<lugar>.<ext>`. Si alguien
  renombra un salón en el panel de administración, su mapa deja de encontrarse y
  la aplicación muestra «No se encontró el mapa del piso» sin más aviso.

### Fidelidad al diseño y responsividad

- La escala tipográfica sale del Figma de Panamá y vive en `public/styles/global.css`
  como `--font-<px del diseño>` (el diseño está dibujado sobre 1080 px de ancho).
- 🔴 **`--u` no es `1dvw`.** La aplicación se encajona en una columna 9:16
  (`main { max-width: calc(100dvh * 9/16) }`), así que medir en `dvw` —el ancho
  de la ventana— hacía que en un monitor 1920×1080 el texto saliera al triple del
  tamaño de su columna. `--u` mide **el ancho útil**. En una pantalla 9:16 vale
  exactamente lo mismo que `1dvw`.
- Los fondos se pintan en una capa `position: fixed` (`.main-page::before`,
  `.espacios::before`), no en el elemento: si no, en cualquier pantalla que no sea
  9:16 quedaban bandas en blanco a los lados de la columna.

## Estructura

- `/src/App.jsx`: enrutamiento con React Router.
- `/src/components`: componentes React reutilizables (AgendaFooter, FiltersPanel, SvgSprites).
- `/src/data/`: datos de agenda en JSON.
- `/src/styles.css`: estilos globales (importa desde `/public/styles/`).
- `/public/`: assets estaticos (iconos, imágenes, estilos CSS) + `web.config` para IIS.
- `/server/`: proxy standalone hacia la API de agenda (servicio de Windows vía NSSM).
- `vite.config.js`: configuración de Vite con soporte para React.
