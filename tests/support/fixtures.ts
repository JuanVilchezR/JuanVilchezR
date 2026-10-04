import { test as base, expect } from '@playwright/test';
import { montarSitio, estable, cargarPerezosas, ORIGEN } from './site.mjs';

export type Sitio = 'antes' | 'despues';

/**
 * `test` con el sitio simulado ya conectado. Por defecto sirve la versión con mejoras ("despues");
 * `test.use({ sitio: 'antes' })` sirve la versión publicada el 04/10/2026 para comparar.
 */
export const test = base.extend<{ sitio: Sitio }>({
  sitio: ['despues', { option: true }],
  context: async ({ context, sitio }, use) => {
    await montarSitio(context, sitio);
    await use(context);
  },
});

export { expect, estable, cargarPerezosas, ORIGEN };

/** Recoge errores de consola y de página para afirmar que no hay ninguno. */
export function vigilarErrores(page: import('@playwright/test').Page) {
  const errores: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(`consola: ${m.text()}`); });
  page.on('pageerror', (e) => errores.push(`página: ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (u.startsWith(ORIGEN) || u.includes('wa.me')) errores.push(`red: ${u} ${r.failure()?.errorText}`);
  });
  return errores;
}

/** Contraste WCAG entre dos colores "rgb(r, g, b)" opacos. */
export function contraste(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [la, lb] = [lum(a), lum(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
