// Soporte de pruebas: sirve vyrseguritec.com.pe desde archivos del repositorio.
//
// El navegador cree que está en el dominio de producción, pero cada petición se responde
// aquí, sin red:
//   · HTML, site.css y site.js  → tests/fixtures/baseline (copia fiel de lo publicado el 04/10/2026)
//   · home "después"            → site/index.html + site/assets/mejoras.css y mejoras.js (lo que se entrega)
//   · páginas internas          → su copia de baseline; en "después" solo cambia que reciben mejoras.css y mejoras.js,
//                                 igual que ocurrirá al desplegar (CSS y JS se comparten en todo el sitio)
//   · tipografías               → paquetes @fontsource (mismas familias que usa la web)
//   · fotos                     → recortes de la propia web (solo para pruebas) o un marcador gris
//   · cualquier otro dominio    → bloqueado (analítica, etc.); wa.me responde una página vacía
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(aqui, '../..');
export const ORIGEN = 'https://www.vyrseguritec.com.pe';

const BASE = path.join(RAIZ, 'tests/fixtures/baseline');
const SITIO = path.join(RAIZ, 'site');
const IMG = path.join(RAIZ, 'tests/fixtures/img');
const NM = path.join(RAIZ, 'node_modules');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Archivo se publica como instancia estática al 87 % de ancho; aquí se usa la variable (wdth 62–125)
// y el @font-face del sitio (font-weight / font-stretch) elige la instancia.
const FUENTES = {
  'archivo-87-800.woff2': '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  'archivo-87-600.woff2': '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2',
  'ibm-plex-sans-400.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
  'ibm-plex-sans-500.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2',
  'ibm-plex-sans-600.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
  'ibm-plex-mono-500.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
};

const IMAGENES = {
  'rociadores-contra-incendio-almacen-480.webp': 'servicio-1.png',
  'cuarto-de-bombas-contra-incendio-480.webp': 'servicio-2.png',
  'panel-de-alarma-contra-incendio-480.webp': 'servicio-3.png',
  'inspeccion-gabinete-contra-incendio.webp': 'servicio-4.png',
  'catalogo/bomba-contra-incendio-patterson-vertical-en-linea-640.webp': 'bomba-1.png',
  'catalogo/bomba-contra-incendio-patterson-succion-final-end-suction-640.webp': 'bomba-2.png',
  'catalogo/bomba-contra-incendio-patterson-carcasa-partida-split-case-640.webp': 'bomba-3.png',
};

const MARCADOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><rect width="640" height="480" fill="#d9d9d9"/><path d="M0 0l640 480M640 0L0 480" stroke="#c4c4c4" stroke-width="2"/></svg>`;

// Modo real: con WEB_DIST (carpeta dist/ compilada del proyecto Astro) el sitio se sirve desde ahí, con sus fotos y
// tipografías reales. WEB_DIST_ANTES (opcional) es la compilación de la rama principal, para comparar antes y después.
const REAL = process.env.WEB_DIST ? path.resolve(process.env.WEB_DIST) : '';
const REAL_ANTES = process.env.WEB_DIST_ANTES ? path.resolve(process.env.WEB_DIST_ANTES) : REAL;
export const MODO_REAL = !!REAL;

const MIME_REAL = {
  ...MIME,
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};

/** Rutas (con barra final) de todas las páginas compiladas en WEB_DIST, menos la 404. */
export function rutasReales() {
  const rutas = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(f);
      else if (e.name === 'index.html') rutas.push('/' + path.relative(REAL, dir).split(path.sep).filter(Boolean).join('/') + (dir === REAL ? '' : '/'));
    }
  };
  recorrer(REAL);
  return rutas.sort();
}

/** Sirve un archivo de dist/ como lo haría Cloudflare Workers (html_handling auto-trailing-slash, 404-page). */
function servirDist(route, url, variante) {
  const raiz = variante === 'antes' ? REAL_ANTES : REAL;
  const ruta = decodeURIComponent(url.pathname);
  const ok = (cuerpo, tipo, estado = 200) => route.fulfill({ status: estado, contentType: tipo, body: cuerpo });
  if (ruta === '/libro-de-reclamaciones/enviar') {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'servicio' }) });
  }
  const candidatos = ruta.endsWith('/') ? [path.join(raiz, ruta, 'index.html')] : [path.join(raiz, ruta)];
  for (const f of candidatos) {
    if (f.startsWith(raiz) && fs.existsSync(f) && fs.statSync(f).isFile()) return ok(fs.readFileSync(f), MIME_REAL[path.extname(f)] ?? 'application/octet-stream');
  }
  if (!ruta.endsWith('/') && fs.existsSync(path.join(raiz, ruta, 'index.html'))) {
    return route.fulfill({ status: 301, headers: { location: ruta + '/' }, body: '' });
  }
  const p404 = path.join(raiz, '404.html');
  return fs.existsSync(p404) ? ok(fs.readFileSync(p404), MIME_REAL['.html'], 404) : ok('no existe', 'text/plain', 404);
}

const leer = (p) => fs.readFileSync(p);
const manifiesto = JSON.parse(leer(path.join(BASE, 'pages/manifest.json'), 'utf8').toString());

/** Inserta mejoras.css tras site.css y mejoras.js tras site.js: es lo que ocurre al desplegar la capa de mejoras. */
function conMejoras(html) {
  return html
    .replace(
      /(<link rel="stylesheet" href="[^"]*assets\/site\.css[^"]*">)/,
      `$1<link rel="stylesheet" href="${ORIGEN}/assets/mejoras.css">`,
    )
    .replace(
      /(<script src="[^"]*assets\/site\.js[^"]*" defer><\/script>)/,
      `$1<script src="${ORIGEN}/assets/mejoras.js" defer></script>`,
    );
}

async function servirOrigen(route, url, variante) {
  if (REAL) return servirDist(route, url, variante);
  const ruta = decodeURIComponent(url.pathname);
  const ok = (cuerpo, tipo) => route.fulfill({ status: 200, contentType: tipo, body: cuerpo });
  const vacio = () => route.fulfill({ status: 204, body: '' });

  if (ruta === '/') {
    const archivo = variante === 'despues' ? path.join(SITIO, 'index.html') : path.join(BASE, 'index.html');
    return ok(leer(archivo), MIME['.html']);
  }
  if (ruta === '/assets/site.css') return ok(leer(path.join(BASE, 'site.css')), MIME['.css']);
  if (ruta === '/assets/site.js') return ok(leer(path.join(BASE, 'site.js')), MIME['.js']);
  if (ruta === '/assets/mejoras.css' || ruta === '/assets/mejoras.js') {
    const f = path.join(SITIO, ruta);
    return variante === 'despues' && fs.existsSync(f)
      ? ok(leer(f), MIME[path.extname(f)])
      : route.fulfill({ status: 404, body: 'no existe' });
  }
  if (ruta.startsWith('/assets/fonts/')) {
    const f = FUENTES[ruta.slice('/assets/fonts/'.length)];
    return f ? ok(leer(path.join(NM, f)), MIME['.woff2']) : route.fulfill({ status: 404, body: '' });
  }
  if (ruta.startsWith('/assets/img/')) {
    const f = IMAGENES[ruta.slice('/assets/img/'.length)];
    return f ? ok(leer(path.join(IMG, f)), MIME['.png']) : ok(MARCADOR, MIME['.svg']);
  }
  if (ruta === '/libro-de-reclamaciones/enviar') {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'servicio' }) });
  }
  if (/^\/(favicon\.(ico|svg)|apple-touch-icon\.png)$/.test(ruta)) return vacio();
  if (manifiesto[ruta]) {
    const html = leer(path.join(BASE, 'pages', manifiesto[ruta])).toString('utf8');
    return ok(variante === 'despues' ? conMejoras(html) : html, MIME['.html']);
  }
  // Cualquier otra ruta del sitio: página mínima para que la navegación no falle.
  return ok(`<!doctype html><html lang="es-PE"><head><meta charset="utf-8"><title>Página de prueba</title></head><body><h1>Página de prueba</h1><p>${ruta}</p></body></html>`, MIME['.html']);
}

/** Conecta un BrowserContext al sitio simulado. `variante`: 'antes' (publicado) o 'despues' (con mejoras). */
export async function montarSitio(context, variante = 'despues') {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === ORIGEN) return servirOrigen(route, url, variante);
    if (url.hostname === 'wa.me') {
      return route.fulfill({ status: 200, contentType: MIME['.html'], body: '<!doctype html><title>WhatsApp</title><p>wa.me</p>' });
    }
    return route.abort();
  });
}

/** Espera fuentes y animaciones con reloj de documento (las ligadas al scroll no terminan nunca y se ignoran). */
export async function estable(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finitas = document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline);
    await Promise.all(finitas.map((a) => a.finished.catch(() => {})));
  });
  await page.waitForTimeout(50);
}

/** Recorre la página para que carguen las imágenes diferidas (loading="lazy") y vuelve arriba. */
export async function cargarPerezosas(page) {
  await page.evaluate(async () => {
    const alto = document.documentElement.scrollHeight;
    for (let y = 0; y < alto; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => {})))));
}
