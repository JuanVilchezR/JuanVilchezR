// Mide la portada publicada vs. con mejoras. Uso: node tests/support/medir.mjs
// Las cifras de docs/auditoria.md y docs/cambios.md salen de aquí.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { montarSitio, estable, cargarPerezosas, ORIGEN, RAIZ } from './site.mjs';

const VISTAS = {
  'escritorio 1440x900': { viewport: { width: 1440, height: 900 } },
  'celular 390x844': { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  'celular chico 320x640': { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true },
};
const OBJETIVOS = ['.menu-btn', 'header .btn-wa', '.hero .ctas .btn', '.mobile-bar .btn', '.quote-card input', '.quote-card select', '.quote-card button[type=submit]', '.slider .arrow', '.slider .dots button', '#preguntas summary', '.cities a'];

const navegador = await chromium.launch();
const filas = [];
for (const [vista, opts] of Object.entries(VISTAS)) {
  for (const variante of ['antes', 'despues']) {
    const ctx = await navegador.newContext({ ...opts, locale: 'es-PE', reducedMotion: 'reduce' });
    await montarSitio(ctx, variante);
    const p = await ctx.newPage();
    await p.goto(ORIGEN + '/');
    await cargarPerezosas(p);
    await estable(p);
    const m = await p.evaluate((objetivos) => {
      const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const cr = (a, b) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const visible = (e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      const enPantalla = (e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
      const wa = [...document.querySelectorAll('a[data-evento="whatsapp"], .wa-float')].filter((e) => visible(e) && enPantalla(e));
      const pequenos = [];
      for (const sel of objetivos) for (const e of document.querySelectorAll(sel)) { if (!visible(e)) continue; const r = e.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) pequenos.push(`${sel} ${Math.round(r.width)}x${Math.round(r.height)}`); }
      const btn = document.querySelector('.hero .ctas .btn-wa'); const bs = getComputedStyle(btn);
      const campo = document.querySelector('.quote-card input'); const cs = getComputedStyle(campo);
      return {
        altoPagina: document.documentElement.scrollHeight,
        altoHeroe: Math.round(document.querySelector('.hero').getBoundingClientRect().height),
        altoFormulario: Math.round(document.querySelector('.quote-card').getBoundingClientRect().height),
        whatsappEnPrimeraPantalla: wa.length,
        sobretitulosVisibles: [...document.querySelectorAll('.eyebrow')].filter(visible).length,
        objetivosMenoresA44: pequenos.length,
        desbordeHorizontalPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        contrasteBotonWhatsApp: +cr(bs.color, bs.backgroundColor).toFixed(2),
        contrasteBordeCampo: +cr(cs.borderTopColor, 'rgb(255, 255, 255)').toFixed(2),
      };
    }, OBJETIVOS);
    filas.push({ vista, variante, ...m });
    await ctx.close();
  }
}
await navegador.close();

const css = fs.readFileSync(`${RAIZ}/site/assets/mejoras.css`);
console.log(JSON.stringify({ mejorasCss: { bytes: css.length, gzip: zlib.gzipSync(css).length, brotli: zlib.brotliCompressSync(css).length } }));
for (const f of filas) console.log(JSON.stringify(f));
