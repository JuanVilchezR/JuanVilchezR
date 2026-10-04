import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, estable, cargarPerezosas, vigilarErrores } from './support/fixtures';
import { montarSitio } from './support/site.mjs';

/**
 * Regresión en páginas internas: mejoras.css se comparte en todo el sitio, así que cada plantilla
 * (servicio, solución, ciudad, blog, catálogo, formularios) debe seguir sana y no empeorar en accesibilidad.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifiesto: Record<string, string> = JSON.parse(fs.readFileSync(path.join(raiz, 'tests/fixtures/baseline/pages/manifest.json'), 'utf8'));
const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function auditar(page: Page, ruta: string) {
  const errores = vigilarErrores(page);
  await page.goto(ruta);
  await cargarPerezosas(page);
  await estable(page);
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const axe = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
  const violaciones: Record<string, number> = {};
  for (const v of axe.violations) violaciones[v.id] = v.nodes.length;
  return { errores, desborde, violaciones };
}

for (const ruta of Object.keys(manifiesto)) {
  test(`${ruta}: sin errores, sin desborde y sin nuevas violaciones de accesibilidad`, async ({ page, browser, viewport, isMobile, hasTouch }) => {
    const despues = await auditar(page, ruta);

    const ctx = await browser.newContext({ viewport: viewport!, isMobile, hasTouch, locale: 'es-PE' });
    await montarSitio(ctx, 'antes');
    const antes = await auditar(await ctx.newPage(), ruta);
    await ctx.close();

    expect(despues.errores).toEqual([]);
    expect(despues.desborde).toBeLessThanOrEqual(0);
    for (const [regla, n] of Object.entries(despues.violaciones)) {
      expect(n, `${regla} (antes: ${antes.violaciones[regla] ?? 0})`).toBeLessThanOrEqual(antes.violaciones[regla] ?? 0);
    }
  });
}

test('las reglas de la portada no se filtran a las páginas internas', async ({ page }) => {
  await page.goto('/contacto/');
  expect(await page.locator('.phero .eyebrow').first().evaluate((e) => getComputedStyle(e).display)).not.toBe('none');
  expect(await page.locator('.topbar .tb-right').evaluate((e) => getComputedStyle(e).display)).not.toBe('none');
  await expect(page.locator('body')).not.toHaveClass(/\bhome\b/);
});

test('catálogo: los filtros siguen ocultando y mostrando modelos', async ({ page }) => {
  await page.goto('/catalogo/bombas-contra-incendio/');
  const total = await page.locator('.cat-grid .placa:visible').count();
  expect(total).toBeGreaterThan(3);
  await page.locator('.cat-tipos button').nth(1).click();
  const filtrado = await page.locator('.cat-grid .placa:visible').count();
  expect(filtrado).toBeGreaterThan(0);
  expect(filtrado).toBeLessThan(total);
});
