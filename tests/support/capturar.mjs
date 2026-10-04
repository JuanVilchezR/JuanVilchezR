// Captura la portada (publicada vs. con mejoras) en varios anchos. Uso:
//   node tests/support/capturar.mjs <antes|despues> <carpeta-salida> [escritorio,movil,...] [pagina]
// Sirve de ayuda para revisar el diseño; no forma parte de la batería de pruebas.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { montarSitio, estable, cargarPerezosas, ORIGEN } from './site.mjs';

const [variante = 'despues', salida = 'docs/capturas', anchos = 'escritorio,movil', pagina = '/'] = process.argv.slice(2);
const VISTAS = {
  escritorio: { width: 1440, height: 900, deviceScaleFactor: 1 },
  laptop: { width: 1366, height: 768, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 1 },
  movil: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  'movil-chico': { width: 320, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};

fs.mkdirSync(salida, { recursive: true });
const navegador = await chromium.launch();
for (const nombre of anchos.split(',')) {
  const v = VISTAS[nombre];
  const contexto = await navegador.newContext({
    viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor,
    isMobile: !!v.isMobile, hasTouch: !!v.hasTouch, locale: 'es-PE', reducedMotion: 'reduce',
  });
  await montarSitio(contexto, variante);
  const p = await contexto.newPage();
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push(String(e)));
  await p.goto(ORIGEN + pagina, { waitUntil: 'load' });
  await cargarPerezosas(p);
  await estable(p);
  const slug = pagina === '/' ? 'inicio' : pagina.replace(/\//g, '_').replace(/^_|_$/g, '');
  const archivo = path.join(salida, `${variante}-${slug}-${nombre}.png`);
  await p.screenshot({ path: archivo, fullPage: true });
  const alto = await p.evaluate(() => document.documentElement.scrollHeight);
  console.log(`${archivo}  (${v.width}x${alto})${errores.length ? '  ERRORES: ' + errores.join(' | ') : ''}`);
  await contexto.close();
}
await navegador.close();
