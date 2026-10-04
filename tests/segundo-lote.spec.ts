import AxeBuilder from '@axe-core/playwright';
import { test, expect, estable } from './support/fixtures';
import { MODO_REAL } from './support/site.mjs';

/**
 * Segundo lote de mejoras sobre el sitio real (hallazgos de la crítica de diseño independiente):
 *  · portada: accesos directos en la primera pantalla y artículos de inspección bajo «antes de su inspección»
 *  · interiores: el índice lateral no se corta en pantallas bajas; pista de desplazamiento en tablas anchas
 *  · catálogo: el resultado del filtro se ve junto a los selectores, «Limpiar filtros», listado compacto en celular
 */
test.skip(!MODO_REAL, 'solo con WEB_DIST (compilación real del sitio)');

const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test('portada: los seis accesos directos caben en la primera pantalla (desde 901 px de ancho)', async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width < 901, 'en celular y tablet los accesos van debajo del formulario');
  await page.goto('/');
  await estable(page);
  const caja = (await page.locator('.hero .quick').boundingBox())!;
  expect(caja.y, 'empiezan dentro de la ventana').toBeLessThan(viewport!.height);
  expect(caja.y + caja.height, 'y caben enteros (1366x768 y 1440x900)').toBeLessThanOrEqual(viewport!.height);
  const form = (await page.locator('.quote-card').boundingBox())!;
  expect(form.x, 'el formulario sigue a la derecha de los accesos').toBeGreaterThan(caja.x + caja.width);
});

test('portada: «antes de su inspección» muestra los artículos de ITSE y de errores previos a la inspección', async ({ page }) => {
  await page.goto('/');
  await estable(page);
  const hrefs = await page.locator('#blog .post-card').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual([
    '/blog/certificado-itse-observaciones-sistema-contra-incendios/',
    '/blog/certificado-de-defensa-civil-itse-sistema-contra-incendio/',
    '/blog/errores-comunes-en-instalaciones-contra-incendio/',
  ]);
});

test('artículo: el índice lateral no se sale de la ventana en pantallas bajas y su último ítem se alcanza', async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width < 981, 'el aside es pegajoso solo desde 981 px');
  await page.setViewportSize({ width: viewport!.width, height: 650 });
  await page.goto('/blog/norma-a130-que-sistema-contra-incendio-exige/');
  await estable(page);
  await page.evaluate(() => window.scrollTo(0, 1400));
  const aside = (await page.locator('.page-grid aside').boundingBox())!;
  expect(aside.y + aside.height, 'el aside entra en la ventana').toBeLessThanOrEqual(650);
  const toc = page.locator('.toc');
  const dim = await toc.evaluate((e) => ({ total: e.scrollHeight, visible: e.clientHeight }));
  expect(dim.total, 'hay más ítems que espacio: el índice se desplaza por dentro').toBeGreaterThan(dim.visible);
  const ultimo = toc.locator('a').last();
  await ultimo.focus();
  const [a, t] = [(await ultimo.boundingBox())!, (await toc.boundingBox())!];
  expect(a.y, 'el ítem enfocado queda dentro del índice').toBeGreaterThanOrEqual(t.y - 1);
  expect(a.y + a.height).toBeLessThanOrEqual(t.y + t.height + 1);
});

test('tablas anchas: la pista aparece solo si la tabla desborda y desaparece al desplazarla', async ({ page }) => {
  await page.goto('/blog/norma-a130-que-sistema-contra-incendio-exige/');
  await estable(page);
  const desbordan = await page.locator('.tbl').evaluateAll((ts) => ts.filter((t) => t.scrollWidth > t.clientWidth + 1).length);
  await expect(page.locator('.tbl-pista')).toHaveCount(desbordan);
  test.skip(desbordan === 0, 'en esta ventana las tablas caben enteras: no debe haber pistas (comprobado arriba)');
  await expect(page.locator('.tbl-pista').first()).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.tbl[tabindex]').first().evaluate((t) => { t.scrollLeft = 120; });
  await expect(page.locator('.tbl-pista')).toHaveCount(desbordan - 1);
});

test('catálogo: el resultado del filtro se ve junto a los selectores y «Limpiar filtros» lo deshace', async ({ page }) => {
  await page.goto('/catalogo/bombas-contra-incendio/');
  await estable(page);
  const estado = page.locator('#cat-estado-n'), limpiar = page.locator('#cat-limpiar');
  const visibles = () => page.locator('.placa:not([hidden])').count();
  const total = await visibles();
  await expect(estado).toHaveText(`${total} modelos`);
  await expect(limpiar).toBeHidden();

  await page.locator('#cat-acc').selectOption('diesel');
  const n = await visibles();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(total);
  await expect(estado).toHaveText(n === 1 ? '1 modelo coincide' : `${n} modelos coinciden`);
  await expect(limpiar).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
  expect(axe.violations.map((v) => v.id), 'accesibilidad con el filtro activo').toEqual([]);

  await limpiar.click();
  await expect(page.locator('#cat-acc')).toHaveValue('');
  await expect(estado).toHaveText(`${total} modelos`);
  await expect(limpiar).toBeHidden();
  await expect(page.locator('#cat-gpm'), 'el foco no se pierde al desaparecer el botón').toBeFocused();

  await page.locator('.cat-tipos button').nth(1).click();
  await expect(limpiar, 'un tipo elegido también cuenta como filtro').toBeVisible();
  await limpiar.click();
  await expect(page.locator('.cat-tipos button[aria-pressed="true"]')).toHaveText('Todas');
  expect(await visibles()).toBe(total);
});

test('catálogo: en celular el listado omite los datos repetidos y de escritorio los conserva', async ({ page, viewport }) => {
  await page.goto('/catalogo/bombas-contra-incendio/');
  await estable(page);
  const filas = page.locator('.placa').first().locator('.placa-datos > div');
  const visibles = await filas.evaluateAll((ds) => ds.filter((d) => getComputedStyle(d).display !== 'none').length);
  expect(visibles).toBe(viewport!.width <= 760 ? 2 : 4);
});
