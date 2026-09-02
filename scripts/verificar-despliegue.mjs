#!/usr/bin/env node
/**
 * Comprueba un despliegue mirando el CUERPO de cada asset, no su código HTTP.
 *
 *   node scripts/verificar-despliegue.mjs [url-base]
 *   # por defecto: https://geoapps.esri.co/cue-2026-agenda
 *
 * 🔴 Por qué no basta el código de estado: IIS devuelve **200** en los dos modos
 * de fallo, y con cuerpos distintos que hay que saber leer.
 *
 * Medido en producción el 2026-09-01:
 *   · asset que EXISTE pero cuyo MIME no está en web.config
 *       → 200 + la página «404 NOT FOUND» de Esri Colombia (~8 KB de HTML)
 *   · asset que NO existe
 *       → 200 + el index.html del SPA (~538 B), por la regla de fallback
 *
 * Así fueron invisibles los dos fondos `.webp`: el sitio respondía 200 a todo y
 * la pantalla salía sin fondo, sin un error en ninguna parte.
 *
 * Este script lee el `index.html` desplegado, saca de él el JS y el CSS con su
 * hash, extrae del CSS todas las `url()` y comprueba que cada respuesta sea del
 * TIPO que toca.
 */
const base = (
  process.argv[2] || "https://geoapps.esri.co/cue-2026-agenda"
).replace(/\/$/, "");
// 🔴 El origen se DERIVA del base. Estaba cableado a geoapps.esri.co, así que el
// script solo servía contra producción: apuntado al `npm run preview` local daba
// dos falsos rojos (pedía el JS y el CSS al host remoto, que no los tiene con ese
// hash). Un verificador que no se puede correr ANTES de desplegar llega tarde.
const origen = new URL(base).origin;
let fallos = 0;
const ok = (s) => console.log(`  ✅ ${s}`);
const mal = (s) => {
  console.log(`  \u{1F534} ${s}`);
  fallos++;
};

/** Clasifica una respuesta por su cuerpo — la firma, no el código. */
async function clasificar(url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const cabeza = buf.subarray(0, 600).toString("latin1");
  const tipo =
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
      ? "webp"
      : buf.subarray(1, 4).toString("latin1") === "PNG"
        ? "png"
        : buf.subarray(0, 4).toString("latin1") === "wOF2"
          ? "woff2"
          : buf.subarray(0, 4).toString("latin1") === "OTTO"
            ? "otf"
            : /^\0\x01\0\0|^true|^ttcf/.test(
                  buf.subarray(0, 4).toString("latin1"),
                )
              ? "ttf"
              : /<svg[\s>]/i.test(cabeza)
                ? "svg"
                : /404 NOT FOUND/i.test(buf.toString("utf8"))
                  ? "404-de-esri"
                  : /<div id="root">/.test(buf.toString("utf8"))
                    ? "index-del-spa"
                    : /<!doctype html|<html/i.test(cabeza)
                      ? "html"
                      : /^\s*[.@:*a-z#-]/i.test(cabeza) && url.endsWith(".css")
                        ? "css"
                        : url.endsWith(".js")
                          ? "js"
                          : "otro";
  return { estado: r.status, bytes: buf.length, tipo };
}

const esperado = (u) => {
  const e = u.split("?")[0].split(".").pop().toLowerCase();
  return (
    {
      webp: "webp",
      png: "png",
      woff2: "woff2",
      otf: "otf",
      ttf: "ttf",
      svg: "svg",
      css: "css",
      js: "js",
    }[e] || null
  );
};

console.log(`\n  verificando ${base}\n`);

// 1. el index desplegado
const idx = await fetch(`${base}/`);
const html = await idx.text();
if (!/<div id="root">/.test(html))
  mal(`el index no parece el del SPA (${html.length} B)`);
else ok(`index.html servido (${html.length} B)`);

// 2. el JS y el CSS que ese index referencia (con su hash: así se ve QUÉ build hay)
const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
  (m) => m[1],
);
const cssUrls = [];
for (const ref of refs) {
  const u = ref.startsWith("http")
    ? ref
    : `${origen}${ref.startsWith("/") ? "" : "/"}${ref}`;
  const r = await clasificar(u);
  const esp = esperado(u);
  if (r.tipo === esp) ok(`${ref.split("/").pop()} — ${r.tipo}, ${r.bytes} B`);
  else
    mal(
      `${ref.split("/").pop()} — esperaba ${esp} y llegó ${r.tipo} (HTTP ${r.estado})`,
    );
  if (u.endsWith(".css")) cssUrls.push(u);
}

// 3. todo lo que pide el CSS: fuentes, fondos, máscaras
for (const cssUrl of cssUrls) {
  const css = await (await fetch(cssUrl)).text();
  const urls = [
    ...new Set(
      [...css.matchAll(/url\(([^)]+)\)/g)].map((m) =>
        m[1].replace(/["']/g, ""),
      ),
    ),
  ];
  console.log(
    `\n  ${urls.length} assets referenciados por ${cssUrl.split("/").pop()}:`,
  );
  for (const u of urls) {
    if (u.startsWith("data:")) continue;
    const abs = u.startsWith("http")
      ? u
      : `${origen}${u.startsWith("/") ? "" : "/"}${u}`;
    const r = await clasificar(abs);
    const esp = esperado(abs);
    const nom = decodeURIComponent(abs.split("/").pop());
    if (r.tipo === esp) ok(`${nom} — ${r.tipo}, ${r.bytes} B`);
    else if (r.tipo === "404-de-esri")
      mal(
        `${nom} — el archivo EXISTE pero IIS no lo sirve: falta su mimeMap en web.config (HTTP ${r.estado}, ${r.bytes} B de HTML)`,
      );
    else if (r.tipo === "index-del-spa")
      mal(
        `${nom} — NO existe en el servidor: cayó en el fallback del SPA (HTTP ${r.estado})`,
      );
    else mal(`${nom} — esperaba ${esp} y llegó ${r.tipo} (HTTP ${r.estado})`);
  }
}

// 3.b TODO lo que vive en public/ y se sirve sin hash
//
// 🔴 Este bloque nació de un falso negativo: la versión anterior solo miraba el
// index y las `url()` del CSS, así que daba VERDE en `images/app-qr.webp` —el QR
// de Inicio, que es un <img> del JSX— mientras en producción estaba roto por el
// mismo mimeMap ausente. Reportaba 2 problemas donde había 3.
//
// Parsear el bundle para encontrar esas rutas es frágil (el JS está minificado y
// los mapas de piso se construyen en runtime: `images/Piso-Salon/${nombre}.${ext}`).
// Así que se recorre `public/` del repo: lo que hay ahí se sirve TAL CUAL, sin
// hash, en la misma ruta. Cubre el QR, los mapas de piso y el favicon.
const publicos = [];
{
  const { readdirSync, statSync, existsSync } = await import("node:fs");
  const raiz = new URL("../public/", import.meta.url).pathname;
  if (existsSync(raiz)) {
    const anda = (dir, rel = "") => {
      for (const e of readdirSync(dir)) {
        const abs = `${dir}${e}`;
        if (statSync(abs).isDirectory()) anda(`${abs}/`, `${rel}${e}/`);
        // `styles/` y `web.config` no se sirven crudos en producción (el CSS va
        // empaquetado con hash; el web.config lo consume IIS, no el navegador).
        else if (!rel.startsWith("styles/") && e !== "web.config")
          publicos.push(`${rel}${e}`);
      }
    };
    anda(raiz);
  }
}
if (publicos.length) {
  console.log(
    `\n  ${publicos.length} assets de public/ (sin hash, ruta directa):`,
  );
  for (const rel of publicos) {
    const abs = `${base}/${rel.split("/").map(encodeURIComponent).join("/")}`;
    const r = await clasificar(abs);
    const esp = esperado(abs);
    if (r.tipo === esp) ok(`${rel} — ${r.tipo}, ${r.bytes} B`);
    else if (r.tipo === "404-de-esri")
      mal(
        `${rel} — EXISTE pero IIS no lo sirve: falta su mimeMap en web.config`,
      );
    else if (r.tipo === "index-del-spa")
      mal(`${rel} — NO existe en el servidor (cayó en el fallback del SPA)`);
    else mal(`${rel} — esperaba ${esp} y llegó ${r.tipo} (HTTP ${r.estado})`);
  }
}

// 4. la API
const api = await fetch(`${base}/api/agenda/charlas/`);
const cuerpo = await api.json().catch(() => null);
const items = Array.isArray(cuerpo) ? cuerpo : cuerpo?.data;
console.log();
if (api.status === 200 && Array.isArray(items))
  ok(`API: 200 con ${items.length} items`);
else {
  const p = cuerpo?.path ?? "";
  mal(
    `API: HTTP ${api.status}${p ? ` · upstream ${p}` : ""} — el front caerá al respaldo de ejemplo SIN avisar`,
  );
  if (/ecuador/.test(p))
    console.log(
      "       ⚠️  el proxy apunta a ECUADOR: revisar API_PATH_PREFIX del servicio",
    );
}

console.log(
  fallos ? `\n  \u{1F534} ${fallos} problema(s)\n` : "\n  ✅ despliegue sano\n",
);
process.exit(fallos ? 1 : 0);
