// Barrido de todas las páginas de la compilación real (WEB_DIST) en escritorio y celular.
// Uso:  WEB_DIST=…/dist [WEB_DIST_ANTES=…/dist] node tests/support/barrido.mjs <antes|despues> <salida.json>
// Por página y ancho mide: errores de consola y de red, desborde horizontal, violaciones de axe (WCAG 2.2 AA),
// encabezados (un solo h1, sin saltos de nivel), controles TOTALMENTE tapados por la cabecera o la barra fija al
// recibir el foco (WCAG 2.4.11, ver foco.mjs), textos menores de 12 px y objetivos táctiles menores de 24 y de 44 px.
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { montarSitio, estable, rutasReales, ORIGEN, MODO_REAL } from './site.mjs';
import { focoTapadoEnPagina } from './foco.mjs';

if (!MODO_REAL) { console.error('Falta WEB_DIST (carpeta dist/ compilada).'); process.exit(1); }
const variante = process.argv[2] === 'antes' ? 'antes' : 'despues';
const salida = process.argv[3] ?? `barrido-${variante}.json`;
const VISTAS = {
  escritorio: { viewport: { width: 1440, height: 900 } },
  movil: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function medir(page) {
  return page.evaluate(async () => {
    const visible = (e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    // encabezados
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map((h) => +h.tagName[1]);
    const saltos = hs.filter((n, i) => i > 0 && n > hs[i - 1] + 1).length;
    // textos pequeños
    const chicos = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const t = w.currentNode; if (!t.textContent.trim()) continue;
      const e = t.parentElement; if (!e || !visible(e) || e.closest('svg,script,style')) continue;
      if (parseFloat(getComputedStyle(e).fontSize) < 12) chicos.add(e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''));
    }
    // objetivos táctiles
    const objetivos = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary')].filter(visible).filter((e) => !e.closest('.skip'));
    const menores = (min) => objetivos.filter((e) => { const r = e.getBoundingClientRect(); return (r.width < min || r.height < min) && getComputedStyle(e).display !== 'inline'; }).length;
    window.scrollTo(0, 0);
    return {
      alto: document.documentElement.scrollHeight,
      desborde: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      h1: hs.filter((n) => n === 1).length, saltosEncabezado: saltos,
      textosMenoresA12: [...chicos].slice(0, 6), objetivosMenoresA24: menores(24), objetivosMenoresA44: menores(44),
    };
  });
}

const navegador = await chromium.launch();
const resultado = { variante, paginas: {} };
const rutas = rutasReales();
for (const [vista, opts] of Object.entries(VISTAS)) {
  const ctx = await navegador.newContext({ ...opts, locale: 'es-PE', reducedMotion: 'reduce' });
  await montarSitio(ctx, variante);
  const page = await ctx.newPage();
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
  page.on('pageerror', (e) => errores.push(`página: ${e.message}`));
  page.on('requestfailed', (r) => { if (r.url().startsWith(ORIGEN)) errores.push(`red: ${r.url()}`); });
  for (const ruta of rutas) {
    errores.length = 0;
    try {
      await page.goto(ORIGEN + ruta, { waitUntil: 'load' });
      await estable(page);
      const m = await medir(page);
      const tapados = await page.evaluate(focoTapadoEnPagina, 120);
      m.focoTapado = tapados.length; m.ejemplosFocoTapado = tapados.slice(0, 3);
      const axe = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
      const violaciones = axe.violations.map((v) => ({ regla: v.id, impacto: v.impact, nodos: v.nodes.length, ejemplo: v.nodes[0]?.target.join(' ') }));
      (resultado.paginas[ruta] ??= {})[vista] = { ...m, violaciones, errores: [...errores] };
    } catch (e) {
      (resultado.paginas[ruta] ??= {})[vista] = { fallo: String(e).slice(0, 200) };
    }
  }
  await ctx.close();
}
await navegador.close();
fs.writeFileSync(salida, JSON.stringify(resultado, null, 1));
console.log(`listo: ${Object.keys(resultado.paginas).length} páginas → ${salida}`);
