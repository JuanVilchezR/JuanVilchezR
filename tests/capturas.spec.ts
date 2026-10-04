import fs from 'node:fs';
import { test, estable, cargarPerezosas } from './support/fixtures';

/**
 * Genera las capturas de docs/capturas (antes/después). Se omite salvo que se pida:
 *   CAPTURAS=1 npx playwright test tests/capturas.spec.ts
 * Usa movimiento reducido para fotografiar siempre el estado final, sin animaciones a medias.
 */
test.skip(!process.env.CAPTURAS, 'solo con CAPTURAS=1');
test.use({ reducedMotion: 'reduce' });

for (const sitio of ['antes', 'despues'] as const) {
  test.describe(sitio, () => {
    test.use({ sitio });
    test(`portada ${sitio}`, async ({ page }, info) => {
      fs.mkdirSync('docs/capturas', { recursive: true });
      await page.goto('/');
      await cargarPerezosas(page);
      await estable(page);
      const n = info.project.name;
      await page.screenshot({ path: `docs/capturas/${sitio}-${n}-pantalla.jpg`, type: 'jpeg', quality: 86 });
      await page.screenshot({ path: `docs/capturas/${sitio}-${n}-completa.jpg`, type: 'jpeg', quality: 80, fullPage: true });
    });
  });
}
