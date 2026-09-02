#!/usr/bin/env node
/**
 * Verifica un token de servicio del kiosco ANTES de ponerlo en producción.
 *
 *   node scripts/verificar-token.mjs <token> [--pais panama] [--host https://cue.esri.pa]
 *
 * Responde las tres preguntas que se hacen el día del despliegue:
 *   1. ¿el token es del país correcto y cuánto le queda?
 *   2. ¿el backend lo acepta y devuelve datos?
 *   3. ¿cubre el evento ENTERO, o caduca a mitad?
 *
 * La tercera es la que motivó este script: el 2026-09-01 producción emitía
 * tokens de 48 h y el evento dura dos días — el token cubría el primero y
 * caducaba 11 h antes de empezar el segundo, sin que nada avisara (el front
 * cae a una agenda de ejemplo en silencio).
 *
 * Sale con código 1 si algo falla, para poder encadenarlo en un despliegue.
 */
const args = process.argv.slice(2);
const token = args.find((a) => !a.startsWith("--"));
const opt = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const pais = opt("pais", "panama");
const host = opt("host", "https://cue.esri.pa");
const prefijo = `/rest/v1/${pais}`;

if (!token) {
  console.error(
    "uso: node scripts/verificar-token.mjs <token> [--pais panama] [--host https://cue.esri.pa]",
  );
  process.exit(1);
}

const ok = (s) => console.log(`  ✅ ${s}`);
const mal = (s) => {
  console.log(`  \u{1F534} ${s}`);
  fallos++;
};
const avisa = (s) => console.log(`  ⚠️  ${s}`);
let fallos = 0;

// ── 1. los claims, sin necesitar el secreto ─────────────────────────────────
let c;
try {
  const p = token.split(".")[1];
  c = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
} catch {
  console.log("  \u{1F534} no es un JWT legible");
  process.exit(1);
}
const h = (s) =>
  new Date(s * 1000).toLocaleString("es", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const ahora = Date.now() / 1000;
const vida = (c.exp - c.iat) / 3600;

console.log(`\n  token: role=${c.role}  pais=${c.pais}`);
console.log(
  `  emitido ${h(c.iat)}  →  caduca ${h(c.exp)}   (vida ${vida.toFixed(1)} h)\n`,
);

if (c.pais !== pais)
  mal(`el token es de «${c.pais}» y se va a usar contra «${pais}» → dará 403`);
else ok(`país correcto (${pais})`);

if (c.exp <= ahora)
  mal(`CADUCADO hace ${((ahora - c.exp) / 3600).toFixed(1)} h`);
else ok(`vigente, quedan ${((c.exp - ahora) / 3600).toFixed(1)} h`);

// ── 2. ¿el backend lo acepta? ───────────────────────────────────────────────
const pedir = async (recurso) => {
  const r = await fetch(`${host}${prefijo}/${recurso}/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const cuerpo = await r.json().catch(() => null);
  const items = Array.isArray(cuerpo) ? cuerpo : cuerpo?.data;
  return {
    estado: r.status,
    items: Array.isArray(items) ? items : null,
    cuerpo,
  };
};

const charlas = await pedir("charlas");
const labs = await pedir("laboratorios");
for (const [nom, r] of [
  ["charlas", charlas],
  ["laboratorios", labs],
]) {
  if (r.estado === 200 && r.items)
    ok(`${nom}: 200 con ${r.items.length} items`);
  else {
    const e = r.cuerpo?.error;
    mal(
      `${nom}: HTTP ${r.estado} — ${(typeof e === "object" ? e?.message : e) || "sin cuerpo"}`,
    );
  }
}

// ── 3. ¿cubre el evento entero? ─────────────────────────────────────────────
const todos = [...(charlas.items || []), ...(labs.items || [])];
if (!todos.length) {
  avisa("sin datos: no se puede comprobar si el token cubre el evento");
} else {
  const porDia = new Map();
  for (const i of todos) {
    const d = String(i.date).slice(0, 10);
    if (d === "undefined" || d === "null") continue;
    const fin = String(i.endTime || i.startTime).slice(11, 16);
    if (!porDia.has(d) || fin > porDia.get(d)) porDia.set(d, fin);
  }
  console.log("\n  cobertura del evento:");
  for (const [d, fin] of [...porDia].sort()) {
    const finTs = new Date(`${d}T${fin}:00`).getTime() / 1000;
    const nom = new Date(`${d}T12:00:00`).toLocaleDateString("es", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
    if (c.exp >= finTs) ok(`${nom} (hasta ${fin}) — cubierto`);
    else mal(`${nom} (hasta ${fin}) — el token caduca ANTES (${h(c.exp)})`);
  }
}

console.log(
  fallos
    ? `\n  \u{1F534} ${fallos} problema(s): NO usar este token todavía\n`
    : "\n  ✅ el token sirve y cubre el evento entero\n",
);
process.exit(fallos ? 1 : 0);
