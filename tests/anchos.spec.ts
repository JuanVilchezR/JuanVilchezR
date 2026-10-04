import { test, expect, estable, cargarPerezosas } from './support/fixtures';

/**
 * Barrido de anchos: ninguna página debe desbordar en horizontal (WCAG 1.4.10 Reflujo), tampoco en los anchos
 * "raros" entre un celular y una tableta. La versión publicada desbordaba entre 521 y 561 px: el botón de menú
 * de la cabecera quedaba fuera de la pantalla (46 px a 521 px).
 * Los anchos se recorren dentro de un solo proyecto con page.setViewportSize.
 */
const ANCHOS = [280, 320, 360, 390, 430, 480, 520, 521, 530, 540, 550, 560, 561, 575, 576, 600, 640, 700, 760, 761, 800, 900, 1000, 1060, 1061, 1200];
const PAGINAS = ['/', '/contacto/', '/servicios/sistema-de-agua-contra-incendio/', '/blog/'];

for (const ruta of PAGINAS) {
  test(`sin desplazamiento horizontal de 280 a 1200 px: ${ruta}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'movil', 'los anchos se recorren dentro de un solo proyecto');
    await page.goto(ruta);
    await cargarPerezosas(page);
    const fallos: string[] = [];
    for (const ancho of ANCHOS) {
      await page.setViewportSize({ width: ancho, height: 800 });
      await estable(page);
      const exceso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (exceso > 0) fallos.push(`${ancho} px: ${exceso} px de más`);
    }
    expect(fallos).toEqual([]);
  });
}

test('el botón de menú de la cabecera queda dentro de la pantalla de 521 a 575 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'movil', 'los anchos se recorren dentro de un solo proyecto');
  await page.goto('/');
  for (const ancho of [521, 540, 560, 575]) {
    await page.setViewportSize({ width: ancho, height: 800 });
    await estable(page);
    const caja = await page.locator('.menu-btn').boundingBox();
    expect(caja!.x + caja!.width, `${ancho} px`).toBeLessThanOrEqual(ancho);
    expect(caja!.width, `${ancho} px`).toBeGreaterThanOrEqual(43.5);
  }
});
