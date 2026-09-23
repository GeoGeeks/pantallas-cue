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
nssm set CueAgendaProxy AppEnvironmentExtra API_TARGET=https://appmovilapi.esri.co API_PATH_PREFIX=/api PORT=3001
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

🔴 **Vigente hoy (Colombia, `appmovilapi.esri.co`): NO hace falta ningún
`API_TOKEN`.** Verificado en vivo el 2026-09-23, con control negativo — los
tres endpoints reales que consume esta app responden **200 sin
Authorization**, y **también 200 mandando un Bearer inválido** (no hay
validación de token en estas rutas):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://appmovilapi.esri.co/api/admin/eventos/CUE_26_CO
curl -s -o /dev/null -w "%{http_code}\n" https://appmovilapi.esri.co/api/admin/eventos/CUE_26_CO/charlas
curl -s -o /dev/null -w "%{http_code}\n" https://appmovilapi.esri.co/api/admin/eventos/CUE_26_CO/laboratorios
# los tres → 200, con o sin -H "Authorization: Bearer lo-que-sea"
```

Como contraste, la ruta paralela de ASISTENTE (sin `/admin`, la que usa la PWA
real) sí lo exige: `GET /api/eventos/CUE_26_CO/charlas` → **401** sin token.
Esto confirma que lo abierto es el hueco ya documentado en las rutas admin
(`EntraIdGuard` sin aplicar ahí), no que todo el backend esté sin protección.

| Variable | Descripción | Valor para Colombia hoy |
|---|---|---|
| `API_TARGET` | Host upstream | `https://appmovilapi.esri.co` |
| `API_PATH_PREFIX` | Prefijo de ruta upstream | `/api` |
| `API_TOKEN` (o `AUTH_TOKEN`) | Bearer token del upstream | **no se declara** — no hace falta ninguno hoy |
| `PORT` | Puerto local del proxy | `3001` |

`API_TARGET`/`API_PATH_PREFIX` son también los defaults ya escritos en
`server/index.js` y `vite.config.js` — así que en rigor, para Colombia, **el
servicio NSSM ni necesitaría declararlas**. Pero si el servicio de Windows
**ya existe de un país anterior** (Panamá: `API_TARGET=https://cue.esri.pa`,
`API_PATH_PREFIX=/rest/v1/panama`, con un `API_TOKEN` puesto), esas variables
explícitas GANAN sobre el default del código — no se limpian solas. Hay que
correr `nssm set` de nuevo con los valores de arriba (o `nssm unset
CueAgendaProxy AppEnvironmentExtra` para borrarlas y que caiga en el
default) y reiniciar el servicio. **Si esto no se hace, el proxy sigue
hablándole al backend viejo (o con un token vencido) y el síntoma es
silencioso**: `getFallbackAgenda()` en `agendaApi.js` hace que cualquier
error de red, 401/403/404/5xx, o incluso 0 resultados, muestre una agenda de
EJEMPLO hardcodeada («Experiencias de innovación», «Salón A») **sin ningún
aviso en pantalla** — la única señal es la consola del navegador, que nadie
mira en un kiosco.

### 4.0 `.env` de DESARROLLO local (`pnpm dev`)

Esto es aparte del proxy de producción — Vite lee su propio `.env` (raíz del
repo, sin versionar) para el proxy de `pnpm dev`. Vigente hoy:

```bash
# .env
VITE_API_PROXY_TARGET=https://appmovilapi.esri.co
VITE_API_PROXY_PATH=/api
VITE_ID_EVENTO=CUE_26_CO
```

Sin `API_TOKEN`/`AUTH_TOKEN`: por lo de arriba, no hace falta ninguno, y
`vite.config.js` ya NO tiene el mecanismo que los inyectaba (se quitó
2026-09-22 junto con la conexión al backend real — si el backend pide un
token de servicio más adelante, hay que reponerlo ahí, no alcanza con
declarar la variable).

`.env.development` (también sin versionar) solo trae una bandera de TLS, sin
relación con autenticación:

```bash
# .env.development
VITE_API_PROXY_SECURE=false
```

### 4.1 (histórico, NO aplica al backend real de Colombia) El token caduca — cómo se obtiene y cómo se renueva

⚠️ Todo este apartado describe el mecanismo de `/rest/v1/{pais}` de EC/PA
(`rest_pwa_ec_2026`/`rest_pwa_pa_2026`) — un backend y un login DISTINTOS al
de Colombia. Se conserva por si el backend de Colombia agrega autenticación a
estas rutas admin más adelante, pero **hoy no hay ningún token que pedir ni
que renovar**; seguir estos pasos contra `cue.esri.pa` no tiene efecto sobre
el proxy de Colombia.

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

- **200 con `nombre`/`lugar`/`tipoActividad` reales del evento de Colombia**
  (ej. `"nombre":"Plenaria"`, `"lugar":"Piso 5"`) → correcto, el proxy ya
  apunta a `appmovilapi.esri.co`.
- **200 con un JSON que se parece a `name`/`location`/`activityType` en vez de
  `nombre`/`lugar`/`tipoActividad`**, o con salones de Panamá («Salón
  Contadora»…) → el servicio NSSM sigue con las variables del país anterior
  (§4). El front lo trataría igual como datos reales, sin avisar — es el caso
  más peligroso porque **no da error**.
- **Error de red, 401, 403, 404 o 5xx** → cae al respaldo de ejemplo
  (`FALLBACK_AGENDA`), también sin avisar en pantalla. Revisar `API_TARGET`/
  `API_PATH_PREFIX` del servicio NSSM.
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

- La escala tipográfica vive en `public/styles/global.css` como cinco tokens
  (`--font-xxl` … `--font-filters`). Son los cinco pasos de **EC producción**
  —no los del Figma de PA— **+6 px**: +2 el 01-09 y dos veces +2 el 02-09, los
  tres por encargo. Se suben los TOKENS y no cada regla; el único `font-size`
  fuera de ellos es el del buscador, y sigue la misma proporción. El diseño está
  dibujado sobre 1080 px de ancho, donde `--u` vale 10,8 px, así que cada 2 px
  son +0,1852 unidades — de ahí los decimales.
- 🔴 **Se sube MULTIPLICANDO, no sumando.** Los tres encargos sumaron +2 px planos
  cada uno y eso aplastó la escala: medido, el paso más grande crecía +18,5 % y el
  más pequeño **+46,3 %**, con el contraste entre extremos cayendo de 2,08× a
  1,74×. El 02-09 se corrigió dejando `--font-xl` en su techo (33 px) y
  recalculando los demás con las proporciones de EC (× **1,22224**). Nada creció y
  ningún paso quedó por debajo del tamaño que ya estaba en pantalla el 01-09.
  **Si vuelve a pedirse «todo 2 px más grande», el cambio correcto es subir `k`,
  no sumarle una constante a cada token.**
- **Dos textos NO siguen la escala**, y por eso hay dos tokens derivados en vez de
  números sueltos: `--font-nombre` (el título del registro de una sesión o
  laboratorio, que el 02-09 se quedó quieto en 31 px mientras el resto subía) y
  `--font-btn-inicio` (los dos botones de Inicio, que ese mismo día bajaron 2 px,
  a 29). Los dos se escriben **restando sobre `--font-xl`**, así que conservan la
  distancia si la escala vuelve a moverse. ⚠️ El ancho del botón de Inicio es
  explícito (`36.44 * var(--u)`) precisamente para que el tamaño del texto no lo
  arrastre: la letra encoge y el botón se queda igual.
- **El mapa del piso crece con la pantalla, y eso se aparta del Figma a propósito**
  (decisión del dueño, 02-09). El diseño lo fija en 660 de 1080 (61,11 %) y con esa
  medida el plano quedaba pequeño en todas las escalas: 660 px en el kiosco y
  **371** en un monitor 1920×1080, porque iba en `--u` —la columna— cuando su
  overlay cubre la ventana entera. Ahora se topa por ancho (92dvw) y por alto útil
  (92dvh menos el cabezote), este último convertido a ancho con la proporción
  **real** de la imagen, que fija el `onLoad` del `<img>` en `--floor-aspect` en vez
  de cablearse. Medido: kiosco 1080×1920 → **994 px**, escritorio 1920×1080 →
  **1476 px**. Si el mapa no se encuentra, el modal vuelve a la medida del Figma
  (`.floor-map-modal--sin-imagen`): sin imagen que escalar, un cartel de aviso del
  ancho de la pantalla no tiene sentido.
- 🔴 **`--u` no es `1dvw`.** La aplicación se encajona en una columna 9:16
  (`main { max-width: calc(100dvh * 9/16) }`), así que medir en `dvw` —el ancho
  de la ventana— hacía que en un monitor 1920×1080 el texto saliera al triple del
  tamaño de su columna. `--u` mide **el ancho útil**. En una pantalla 9:16 vale
  exactamente lo mismo que `1dvw`.
- Los fondos se pintan en una capa `position: fixed` (`.main-page::before`,
  `.espacios::before`), no en el elemento: si no, en cualquier pantalla que no sea
  9:16 quedaban bandas en blanco a los lados de la columna.

## Colombia (2026-09-23, noche) — auditoría e2e: datos, funcionalidad y diseño

🧭 Auditoría completa contra el PR #4 ya abierto (dev server real, no solo lectura de código):
cruce de los 72 charlas + 6 laboratorios reales contra lo que pinta cada pantalla, recorrido en
navegador de las 3 secciones × 2 días, filtros, buscador, menú y los 16 mapas de piso — 0
errores de consola en toda la sesión.

🔴 **HALLAZGO PRINCIPAL, sin decidir a propósito — elevado, no implementado:** los 6
laboratorios reales traen `disponibilidad[]` con **8 franjas horarias reales cada uno** (3 el
jueves 14:00-17:00 + 5 el viernes 07:00-12:00) y `cupo` (60), pero el contrato real NO trae
`fecha`/`horaInicio`/`horaFin` a nivel de laboratorio — esos tres campos llegan `null`. El
adaptador (`adaptRealApiItem`, `agendaApi.js`) los pasa tal cual, y en pantalla el resultado es:
**ningún laboratorio muestra hora, ni pestañas de día, ni cupo** — solo un ícono de reloj sin
texto antes del piso. Verificado en el DOM (`Ocultar detalles del laboratorio` expandido): ni la
descripción larga ni la tarjeta muestran `objetivos[]`, `cupo` ni `disponibilidad` en ningún
lugar. El campo `dia` (`"Jueves"` fijo en los 6, no confiable: un laboratorio real ocurre en
jueves Y viernes) tampoco se lee en ningún sitio del código — confirmado con `grep`.

Esto es distinto de lo que decía la nota anterior de este mismo README (*"dato real disponible
y sin usar... no es un defecto"*): no es que falte pintar un dato decorativo, es que **un
laboratorio con 8 franjas reales en 2 días se muestra como si ocurriera una sola vez, sin hora**
— en un kiosco físico cuyo propósito es decirle a alguien cuándo y dónde ir. Sin arreglar a
propósito: mostrar las 8 franjas bien (agrupadas por día, con su cupo) es una decisión de
diseño/alcance, no un fix de una línea — necesita el panel real (o al dueño) para confirmar
cómo debe leerse `disponibilidad` antes de tocar código.

🟡 **El buscador queda atado al día activo, en silencio.** Reproducido: en la pestaña "Jueves"
de Charlas, buscar *"Data Pipelines"* (una charla real que solo existe el viernes) da **0
resultados** sin ningún aviso de que el filtro de día sigue aplicado — y las pestañas
Jueves/Viernes **desaparecen** de la vista mientras se busca, reemplazadas por la caja de
búsqueda. Hay una forma de volver (un icono pequeño junto a "Limpiar", poco visible) que
restaura las pestañas; sin conocerlo, la ruta más corta es borrar la búsqueda entera. Mismo
término, en la pestaña "Viernes", sí encuentra la charla. No es un defecto de datos —es el
mismo patrón en Salones y Laboratorios— y no se corrigió porque cambiar el comportamiento
(¿buscar en los dos días a la vez? ¿mantener visibles las pestañas?) es una decisión de UX, no
solo de código.

✅ **Todo lo demás, verificado y sin hallazgos:**
- Categorización Salones/Charlas/fuera-de-agenda: 38/30/4 sobre 72 charlas reales de hoy (creció
  1 desde el 22-09 — dato vivo, normal), conteos en pantalla **idénticos** por día
  (Salones Jueves 25 · Viernes 13 · Charlas Jueves 12 · Viernes 18 · Laboratorios 6),
  medido con `document.querySelectorAll('.evento').length` contra cada pestaña.
- Los 16 mapas de piso responden **200** contra los 16 `lugar` reales (charlas + laboratorios),
  probado con `fetch` directo, no solo mirando la pantalla.
- Filtros (Lugar, Temática, Dirigido a, Producto, Nivel de sesión) aplican y acotan la lista
  correctamente; probado con "Lugar - Piso = Piso 3 - Salón K" en Viernes → las 3 charlas
  correctas, badge de conteo correcto, "Limpiar filtros" visible.
- Menú "Espacios" resalta la sección activa con su color correcto y navega bien entre las tres.
- Sin campos críticos vacíos, sin `horaInicio >= horaFin`, sin inconsistencia `fecha`/`dia`, sin
  registros con `isDeleted`/`deletedAt`, en ninguna de las 72 charlas.

## Colombia (2026-09-23, tarde) — los 3 lugares sin mapa: producción YA los corrigió, y los 16 mapas reales ya cubren el catálogo completo

✅ **Verificado contra la API real** (`GET /api/admin/eventos/CUE_26_CO/{charlas,laboratorios}`,
sin credenciales): las 3 ubicaciones del hallazgo del 22-09 (bloque de abajo) **ya no existen**
en el dato de producción — alguien del panel las corrigió. Pero el valor real que quedó **no es
igual a la hipótesis que se había escrito aquí**:

| `lugar` viejo (22-09) | Hipótesis escrita el 22-09 | `lugar` real HOY en producción |
|---|---|---|
| «Piso 2 - Salón J» | «Piso 3 - Salón J» | **«Piso 3 - Salón J»** ✅ acertó |
| «Piso 2 - Salón K» | «Piso 3 - Salón K» | **«Piso 3 - Salón K»** ✅ acertó |
| «Salon Principal» | «Piso 5» | **«Piso 3 - Salón N»** ❌ no era «Piso 5» |

🔴 **La hipótesis de «Salon Principal» → «Piso 5» estaba mal, y el cruce de horarios que la
sostenía no lo detectaba: apuntaba a un salón que sí existe pero no es el que el panel eligió.**
No hace falta ningún alias en código — nunca se llegó a escribir uno (`grep` sobre `src/` no
encuentra ninguno) — porque la resolución del mapa es genérica por nombre de archivo
(`Actividades.jsx`: `images/Piso-Salon/${lugar}.${ext}`), y con el `lugar` ya corregido en el
dato real, calza solo.

✅ **Cruce completo, no solo las 3 conocidas**: los 16 `lugar` únicos que hoy traen los 72
charlas + 6 laboratorios reales de `CUE_26_CO` tienen los 16 mapas ya presentes en
`public/images/Piso-Salon/` (el swap de assets de Colombia, sin commitear) — cero faltantes,
cero sobrantes. `Piso 2 - Salón EFG` (que no lo usa ninguna charla) lo usan los 6 laboratorios.

📋 **Nada de código quedó por tocar** para este hallazgo — la sección de abajo («3 lugares
reales sin mapa de piso») queda como histórica; se mantiene por lo que enseña, no porque siga
pendiente.

## Colombia (2026-09-23) — el encabezado del mapa de piso tenía el color de la sección

🔴 **Auditoría de fidelidad contra el Figma real** (extensión de Chrome, sin gastar cuota
MCP): el título "Mapa del piso" y su ícono de cerrar (X) están fijos en gris neutro
(`gris 6`, `#2B2B2B`) en las tres secciones — no cambian con la sección, a diferencia de
casi todo lo demás en `espacios.css`. El código tenía las dos reglas en
`var(--color-espacio-dark)` (el color DE LA SECCIÓN), así que el título y la X salían en
violeta/azul-marino/rosa-fucsia según desde dónde se abriera el mapa. Se coló porque la
corrección de colores del 22-09 solo auditó el FONDO del modal, nunca su encabezado.

Corregido en `.floor-map-header h2` y `.floor-map-close` (`espacios.css`) → `var(--gris-6)`.
Verificado en las tres pantallas (`getComputedStyle` → `rgb(43, 43, 43)` en las tres) y con
`pnpm build` (el bundle final trae `var(--gris-6)` en las dos reglas) — 0 errores de consola.

## Colombia (2026-09-22, tarde) — backend real conectado

El bloque de abajo («Colombia, 2026-09-22») es el swap de marca del mismo día
por la mañana; esto es lo que cambió por la tarde, en la misma fecha, y dos de
sus afirmaciones quedan **superadas**: la paleta NO se sacó bien a pipeta (dos
de los tres colores estaban en la sección equivocada) y el backend SÍ se
conectó.

```
Verificado 2026-09-22 con curl directo contra el backend, sin credenciales:
GET /api/admin/eventos/CUE_26_CO              → 200 (sin Authorization)
GET /api/admin/eventos/CUE_26_CO/charlas      → 200 · 71 charlas reales
GET /api/admin/eventos/CUE_26_CO/laboratorios → 200 · 6 laboratorios reales
GET /api/eventos/CUE_26_CO/charlas (sin admin) → 401 sin token (sí exige bearer)
```

🔴 **Los tres colores de sección estaban con el mapeo cruzado.** Se habían
sacado a pipeta del PNG sin Copy-as-CSS; leyendo el color real del título de
cada pantalla en el panel de Figma (extensión de Chrome, sin gastar cuota del
MCP): **Salones = Violeta `#7D00FE`** (no Vino) · **Charlas técnicas =
Azul-oscuro `#004081`** (no `#00304D`) · **Laboratorios = Rosa-Fucsia
`#F9047D`** (no Violeta — es el mismo tono del botón de Labs. en Inicio).
"Vino" (`#921754`) no existe en ningún título real y se retiró de
`global.css`. De paso, el modal del mapa de piso tenía el verde pastel
literal de Ecuador (`#E6FFF0`); el de Colombia es `--lavanda` (`#EEE3FF`).

✅ **Backend conectado**: `appmovilapi.esri.co` (NestJS + SQL Server — el
mismo que usa el panel de administración de CUE_CO), evento `CUE_26_CO`
(`VITE_ID_EVENTO`, `src/config/agenda.js`). El proxy (`vite.config.js` en dev,
`server/` en producción) reenvía `withBase("/api/agenda")/*` tal cual hacia
`https://appmovilapi.esri.co/api/*` — ya no inyecta ningún Bearer.

🔴 **Son rutas `/admin/...`, no rutas públicas a propósito.** Responden 200
sin token porque el panel de CUE_CO tiene un hueco de seguridad ya
documentado (`EntraIdGuard` sin aplicar a esas rutas específicas), no porque
el backend haya decidido abrirlas para este uso. Si el equipo de backend lo
cierra, esta app empieza a dar 401 sin aviso. **Pendiente: pedir por escrito
que se queden abiertas para este caso de uso, o un token de servicio.**

🔴 **El adaptador de contrato es nuevo** (`adaptRealApiItem` en
`agendaApi.js`): la forma real (`nombre/descripcion/fecha/horaInicio/
horaFin/tipoActividad/lugar/visibilidad/tematicas[]/productosEsri[]/
publicosObjetivo[]/nivelesSesion[]`) no se parece en nada al contrato viejo
de EC/PA. Se traduce en la frontera, sin tocar `normalizeItem`,
`agendaUtils.js` ni `Actividades.jsx`.

✅ **Resuelto el mismo día — el 41 % de las charlas reales que no aparecían en
ninguna pantalla.** De las 71 charlas de `CUE_26_CO`, solo 12 empezaban por
«Salón» y 25 por «Charla». Elevado y decidido con el dueño: los 25 «Summit
…» (Territorios conectados, GeoIA, Operaciones conectadas, Imágenes y
teledectección, Operaciones inteligentes) entran a **Salones temáticos** por
prefijo «Summit» — mismo criterio robusto que «Salón», un Summit nuevo entra
solo. «Meet & Greet» (5) entra a **Charlas técnicas**, por `ademas` — es una
cadena exacta, no una familia de tipos. «Plenaria» y «Actividad social» (4:
Break, Almuerzo) se dejan fuera **a propósito** — logística del evento, no
contenido de agenda. Verificado contra las 71 charlas reales: 37 a Salones +
30 a Charlas + 4 fuera = 71, sin superposición. Ver `AGENDA_SECTIONS` y
`matchesActivityType` (`agendaUtils.js`), que ahora soporta `prefijos`
(plural) y `ademas` en `filtroTipo`.

🔴 **`TIPOS_LABORATORIO` decía «Laboratorios de entrenamiento» — el título de
la pantalla, no el dato real.** Los 6 laboratorios reales traen
`tipoActividad: "Laboratorio practico"`; con el valor viejo, el filtro
`incluir` no calzaba con ninguno y la pantalla se habría visto vacía pese a
tener datos. Corregido — sigue frágil si el panel agrega un segundo tipo de
laboratorio, ver el aviso en `agenda.js`.

🔴 **3 lugares reales sin mapa de piso — (histórico, ya corregido en producción, ver el
bloque de arriba «2026-09-23, tarde»). La primera lectura (misma tarde) estaba MAL: dije que
eran espacios distintos sin comprobar la hora, y al cruzarla el patrón apunta a lo
contrario.** Afecta 11 actividades:

| `lugar` real | Actividades | Probable es en realidad |
|---|---|---|
| «Piso 2 - Salón J» | 3, viernes 8:30-11:10 | **«Piso 3 - Salón J»** — ese mapa existe y tiene **cero** actividades propias; sin choque posible |
| «Piso 2 - Salón K» | 3, viernes 8:30-11:10 | **«Piso 3 - Salón K»** — ese mapa lo usan 2 charlas, pero el **jueves**; día distinto, sin choque |
| «Salon Principal» | 5, jueves 15:30-16:55 | **«Piso 5»** — su última actividad ahí termina **15:25**, cinco minutos antes; secuencia, no paralelo |

Las 11 actividades reales, para llevar el pedido de confirmación con nombre y
hora en mano:

```
«Piso 2 - Salón J» (viernes 2026-10-02):
  08:30-09:10  Interoperabilidad e Integración de Servicios Web entre ArcGIS y Microsoft…
  09:15-09:55  Del mapa a la experiencia: ¿Cómo elegir la aplicación correcta…?
  10:30-11:10  Automatiza la preparación de datos con ArcGIS Data Pipelines

«Piso 2 - Salón K» (viernes 2026-10-02):
  08:30-09:10  Anticipar para actuar: Monitoreo ambiental inteligente con ArcGIS Experience Builder
  09:15-09:55  Controle la salud del Cultivo al instante: Monitoreo Agrícola con ArcGIS Arcade
  10:30-11:10  Innovación en gobernanza vial: Optimizando la gestión de vías…

«Salon Principal» (jueves 2026-10-01, Summit Operaciones conectadas):
  15:30-15:35  Introducción
  15:35-15:50  Transformación digital de la gestión de infraestructura y movilidad del SITM-MIO
  15:45-16:15  Sistema de Información Territorial y Geovisor del sector lechero del Cauca
  16:15-16:35  Observatorio Nacional de Seguridad Vial ONSV
  16:35-16:55  Transformación y eficiencia en los procesos de Sanidad Vegetal
```

**No se aplicó ningún alias, y resultó ser lo correcto**: la hipótesis de «Salon Principal» →
«Piso 5» estaba mal (era «Piso 3 - Salón N», ver arriba) — de haberse cableado un alias con esa
suposición, el kiosco habría mostrado el plano equivocado a partir del 23-09, cuando el panel
corrigió el dato real.

⚠️ **`GET /api/admin/eventos/CUE_26_CO` no incluye "charlas" en
`modulosHabilitados`** (`["laboratorios","speakers","experiencias","stands",
"encuestas"]`) aunque los datos de charlas existen y responden 200. Vale la
pena confirmar con el cliente si Charlas técnicas debe mostrarse públicamente
para este evento o si ese módulo sigue sin activar a propósito.

⚠️ **Las horas NO se convierten de zona horaria, a propósito.** El backend
manda `horaInicio`/`horaFin` con sufijo `Z` (ej.
`2026-10-01T08:00:00.000Z`), pero convertir de verdad (UTC−5) dejaría una
Plenaria de apertura a las 3:00 a.m. — todo indica que el backend guarda la
hora de pared de Bogotá marcada como si fuera UTC, el mismo síntoma ya
documentado en `CUE_EC`. Se toman los dígitos tal cual (`normalizeTime`),
sin verificarlo contra el cronograma real del evento — nadie con el
cronograma en mano lo ha confirmado todavía.

⚠️ **Dato real disponible y sin usar**: los laboratorios traen `cupo`,
`disponibilidad` y `objetivos[]` que hoy ninguna pantalla pinta. No es un
defecto — es una decisión de alcance pendiente si se quiere mostrarlos.

## Colombia (2026-09-22, mañana — histórico; ver el bloque de arriba para el estado del backend y la paleta)

Esta aplicación pasa a servir el evento de **Colombia** — mismo swap de marca que
Panamá el 01-09, esta vez con TRES secciones en vez de dos. Insumos en
`actualizacion-Colombia/` (sin versionar): el export del Figma
(`Colombia.png`/`.svg`, 7 pantallas), el logo oficial (`esri_col.svg`), los 16
mapas de piso reales (`Mapas CO/`) y los dos QR de descarga (Android/iOS).

- **Reaparece Charlas técnicas.** `Colombia.png` muestra tres botones en
  Inicio (Salones, Charlas técnicas, Labs. entrenamiento) donde Panamá tenía
  dos — ver `src/config/agenda.js`. `charlas` va por **prefijo** («Charla…»),
  igual que Salones, pero a diferencia de Salones (medido contra producción de
  Panamá) **este prefijo no está verificado contra un catálogo real de
  Colombia todavía**: el aviso completo vive en el propio archivo.
- 🔴 **El backend NO se conectó.** El de Colombia es `appmovilapi.esri.co` —la
  misma API del panel de administración de CUE_CO (NestJS + SQL Server), no el
  `rest_pwa_ec_2026` de EC/PA— y su contrato público de agenda no se investigó
  en esta sesión: era un swap de assets, no de integración. `vite.config.js`
  sigue con los valores por defecto de Panamá (comentado en el propio
  archivo); mientras tanto la app sirve el respaldo cableado de
  `agendaApi.js`, como ya hacía antes de este cambio.
- **La paleta se sacó A PIPETA de `Colombia.png`**, no de un Copy-as-CSS del
  Figma (no llegó ninguno): Vino `#921754` (Salones) · Azul marino `#00304D`
  (Charlas técnicas) · Violeta `#7D00FE` (Laboratorios, antes verde) · Morado
  oscuro `#473D93` (texto/logo de Inicio). Ver `public/styles/global.css`.
- **Inicio invierte el contraste de Panamá**: el fondo pasa de claro a oscuro
  (`bg-inicio.webp`), así que el logo, el título y los tres botones pasan de
  texto blanco sobre color sólido a texto morado sobre píldoras claras
  (blanco/lavanda/lila) — no es el color de cada sección, es una escala de
  tono, medida en el PNG.
- **Dos QR en vez de uno**, con su distintivo de tienda debajo de cada uno
  (Google Play / App Store), tal como el Figma. Los distintivos son los
  oficiales de Google/Apple, recortados del propio export en alta resolución
  — no son un asset inventado.
- **Los 16 mapas de piso son los reales de Colombia** (`Mapas CO/`), copiados
  con su nombre de archivo tal cual («Piso 3 - Salón K.png»…). ⚠️ Igual que en
  Panamá, la coincidencia con `item.lugar` depende de que el dato real use
  exactamente ese texto — sin backend conectado, esto no se pudo verificar.
- **El logo `esri Colombia`** (`logo-esri-colombia` en `SvgSprites.jsx`) es el
  contenido de `esri_col.svg` con el `fill` fijo cambiado a `currentColor`,
  para que herede color por CSS como ya hacía el de Panamá.
- El favicon (`public/fav_icon.png`) es el mismo badge «Cue» de Panamá con un
  cambio de tono H/S (verde → violeta) por HSV, conservando su V (la textura
  del trazo) y su alfa (el borde irregular) — no se redibujó a mano porque no
  llegó un icono propio de Colombia entre los assets.

## Estructura

- `/src/App.jsx`: enrutamiento con React Router.
- `/src/components`: componentes React reutilizables (AgendaFooter, FiltersPanel, SvgSprites).
- `/src/data/`: datos de agenda en JSON.
- `/src/styles.css`: estilos globales (importa desde `/public/styles/`).
- `/public/`: assets estaticos (iconos, imágenes, estilos CSS) + `web.config` para IIS.
- `/server/`: proxy standalone hacia la API de agenda (servicio de Windows vía NSSM).
- `vite.config.js`: configuración de Vite con soporte para React.
