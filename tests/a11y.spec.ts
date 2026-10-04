import AxeBuilder from '@axe-core/playwright';
import { test, expect, estable, cargarPerezosas } from './support/fixtures';

const REGLAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test('portada: cero violaciones de accesibilidad WCAG 2.2 AA (axe-core)', async ({ page }) => {
  await page.goto('/');
  await cargarPerezosas(page);
  await estable(page);
  const r = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
  const resumen = r.violations.map((v) => `${v.id} [${v.impact}] x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(resumen).toEqual([]);
});

test.describe('línea base publicada (informativo)', () => {
  test.use({ sitio: 'antes' });
  test('lista lo que axe encuentra en la portada actual', async ({ page }, info) => {
    await page.goto('/');
    await cargarPerezosas(page);
    await estable(page);
    const r = await new AxeBuilder({ page }).withTags(REGLAS).analyze();
    const resumen = r.violations.map((v) => `${v.id} [${v.impact}] x${v.nodes.length}`);
    info.annotations.push({ type: 'axe-publicada', description: resumen.join('; ') || 'sin violaciones' });
    console.log(`[${info.project.name}] axe sobre la portada publicada → ${resumen.join('; ') || 'sin violaciones'}`);
    expect(true).toBe(true);
  });
});
