import AxeBuilder from '@axe-core/playwright';
import { test, expect, estable, vigilarErrores } from './support/fixtures';
import { MODO_REAL, rutasReales } from './support/site.mjs';
import { focoTapado } from './support/foco.mjs';

/**
 * Barrido de TODAS las páginas de la compilación real (WEB_DIST): sin errores de consola ni de red, sin desborde
 * horizontal, axe WCAG 2.2 AA en cero, un solo h1 y encabezados sin saltos de nivel. Se recorre en escritorio y celular.
 * Además, WCAG 2.4.11 (foco no oculto, ver support/foco.mjs) en las plantillas principales.
 */
test.skip(!MODO_REAL, 'solo con WEB_DIST (carpeta dist/ compilada del sitio)');

const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VISTAS = ['escritorio', 'movil'];
const PLANTILLAS = ['/', '/servicios/sistema-de-agua-contra-incendio/', '/sistemas-contra-incendios/lima/', '/blog/norma-a130-que-sistema-contra-incendio-exige/', '/catalogo/bombas-contra-incendio/', '/contacto/'];

for (const ruta of MODO_REAL ? rutasReales() : []) {
  test(`${ruta}: sin errores, sin desborde, axe en cero y encabezados en orden`, async ({ page }, info) => {
    test.skip(!VISTAS.includes(info.project.name), 'se recorre en escritorio y celular');
    const errores = vigilarErrores(page);
    await page.goto(ruta);
    await estable(page);
    expect(errores).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 'desborde horizontal').toBeLessThanOrEqual(0);
    const axe = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
    expect(axe.violations.map((v) => `${v.id} x${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    const niveles = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter((h) => (h as HTMLElement).offsetParent !== null).map((h) => Number(h.tagName[1])));
    expect(niveles.filter((n) => n === 1), 'un solo h1').toHaveLength(1);
    expect(niveles.filter((n, i) => i > 0 && n > niveles[i - 1] + 1), 'saltos de nivel de encabezado').toEqual([]);
  });
}

for (const ruta of PLANTILLAS) {
  test(`${ruta}: ningún control queda tapado por la cabecera o la barra fija al recibir el foco (WCAG 2.4.11)`, async ({ page }, info) => {
    test.skip(!VISTAS.includes(info.project.name), 'se recorre en escritorio y celular');
    await page.goto(ruta);
    await estable(page);
    expect(await focoTapado(page)).toEqual([]);
  });
}
