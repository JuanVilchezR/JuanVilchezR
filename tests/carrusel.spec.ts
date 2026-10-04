import type { Page } from '@playwright/test';
import { test, expect, estable, vigilarErrores } from './support/fixtures';

/**
 * Botón de pausa del carrusel (mejoras.js). WCAG 2.2.2 (nivel A): el avance automático cada 5 s debe poder detenerse.
 * mejoras.js no modifica site.js: pausa con el evento mouseenter (el que site.js ya usa para detenerse) y
 * retiene mouseleave y focusout mientras el visitante lo tiene en pausa.
 */

/** Índice de la diapositiva activa: site.js marca aria-selected en el punto correspondiente. */
const activa = (page: Page) =>
  page.locator('.slider .dots button').evaluateAll((puntos) => puntos.findIndex((p) => p.getAttribute('aria-selected') === 'true'));

/**
 * Abre la portada con un reloj falso y detenido: el avance de site.js se controla con page.clock.runFor()
 * y la prueba no espera tiempo real. Los asserts comparan contra el valor leído, no contra un número fijo.
 */
async function abrirConRelojDetenido(page: Page) {
  await page.clock.install({ time: new Date('2026-10-05T10:00:00-05:00') });
  await page.goto('/');
  await expect(page.locator('.slider .dots button')).toHaveCount(4);
  await expect(page.locator('.slider-pausa')).toHaveCount(1);
  const ahora = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(ahora + 1000);
}

const AVANCE = 5100; // un solo avance (site.js usa 5000 ms)
const LARGO = 12_000; // dos avances: si el carrusel siguiera activo, la diapositiva cambiaría

test.describe('carrusel: botón de pausa', () => {
  const medir = (page: Page) => page.evaluate(() => {
    const s = document.querySelector('#slider') as HTMLElement;
    const b = s.querySelector('.slider-pausa') as HTMLElement | null;
    if (!b) return null;
    const caja = (e: Element) => e.getBoundingClientRect();
    const cruza = (a: DOMRect, c: DOMRect) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
    const pb = caja(b);
    const icono = caja(b.querySelector('.i-pausa')!);
    const ps = caja(s);
    const activo = s.querySelector('.slide[aria-hidden="false"]')!;
    const controles = [...s.querySelectorAll('.arrow, .dots button')].map(caja);
    const textos = [...activo.querySelectorAll('figcaption b, figcaption span')].map(caja);
    return {
      primero: s.querySelector('button, a[href], [tabindex]') === b,
      ancho: pb.width,
      alto: pb.height,
      dentro: pb.left >= ps.left && pb.right <= ps.right && pb.top >= ps.top && pb.bottom <= ps.bottom,
      choquesControles: controles.filter((o) => cruza(pb, o)).length, // las áreas de toque no se pisan
      choquesTexto: textos.filter((o) => cruza(icono, o)).length, // el icono no tapa el título ni la descripción
      nombre: b.getAttribute('aria-label'),
      tipo: b.getAttribute('type'),
      cursor: getComputedStyle(b).cursor,
    };
  });

  test('es el primer control del carrusel, mide 44 px y se anuncia', async ({ page }) => {
    await page.goto('/');
    await estable(page);
    const r = await medir(page);
    expect(r).not.toBeNull();
    expect(r).toMatchObject({ primero: true, dentro: true, tipo: 'button', cursor: 'pointer' });
    expect(r!.ancho).toBeGreaterThanOrEqual(43.5);
    expect(r!.alto).toBeGreaterThanOrEqual(43.5);
    expect(r!.nombre).toBe('Pausar el cambio automático de imágenes');
  });

  test('no pisa las flechas ni los puntos ni tapa el texto, en ninguna de las 4 diapositivas', async ({ page }) => {
    await page.goto('/');
    await estable(page);
    for (let i = 0; i < 4; i++) {
      await page.locator('.slider .dots button').nth(i).click();
      await page.waitForTimeout(750); // el carrusel tarda 0,6 s en desplazarse
      const r = await medir(page);
      expect(r, `diapositiva ${i + 1}`).toMatchObject({ choquesControles: 0, choquesTexto: 0 });
    }
  });

  test('en cualquier ancho de celular ningún control del carrusel se pisa con otro', async ({ page }, info) => {
    test.skip(info.project.name !== 'movil', 'los anchos se recorren dentro de un solo proyecto');
    await page.goto('/');
    for (const ancho of [320, 340, 360, 375, 390, 414, 430, 480, 520]) {
      await page.setViewportSize({ width: ancho, height: 800 });
      await estable(page);
      const r = await page.evaluate(() => {
        const s = document.querySelector('#slider')!;
        const cajas: [string, DOMRect][] = [
          ['pausa', s.querySelector('.slider-pausa')!.getBoundingClientRect()],
          ['anterior', s.querySelector('.prev')!.getBoundingClientRect()],
          ['siguiente', s.querySelector('.next')!.getBoundingClientRect()],
          ...[...s.querySelectorAll('.dots button')].map((b, i): [string, DOMRect] => [`punto ${i + 1}`, b.getBoundingClientRect()]),
        ];
        const cruza = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom && a.bottom > b.top;
        const choques: string[] = [];
        for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) if (cruza(cajas[i][1], cajas[j][1])) choques.push(`${cajas[i][0]} y ${cajas[j][0]}`);
        return { choques, puntoMasAngosto: Math.min(...cajas.filter(([n]) => n.startsWith('punto')).map(([, c]) => c.width)) };
      });
      expect(r.choques, `${ancho} px`).toEqual([]);
      expect(r.puntoMasAngosto, `${ancho} px`).toBeGreaterThanOrEqual(25.5);
    }
  });

  test('foco visible: anillo blanco sobre el fondo oscuro del carrusel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.slider-pausa').focus();
    const anillo = await page.locator('.slider-pausa').evaluate((e) => { const c = getComputedStyle(e); return { estilo: c.outlineStyle, color: c.outlineColor }; });
    expect(anillo).toMatchObject({ estilo: 'solid', color: 'rgb(255, 255, 255)' });
  });

  test('pausa: la diapositiva deja de cambiar y no se reanuda al salir el puntero', async ({ page }) => {
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    const inicio = await activa(page);
    await page.clock.runFor(AVANCE);
    expect(await activa(page), 'sin pausa, avanza sola').toBe((inicio + 1) % 4);

    await boton.click(); // el puntero queda sobre el carrusel
    await expect(boton).toHaveAttribute('aria-label', 'Reanudar el cambio automático de imágenes');
    await expect(boton).toHaveAttribute('data-pausado', 'true');
    await page.mouse.move(2, 2); // el puntero sale: site.js reanudaría con mouseleave
    const congelada = await activa(page);
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(congelada);
  });

  test('reanudar: el avance automático vuelve y el botón recupera su etiqueta', async ({ page }) => {
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    await boton.click();
    await page.mouse.move(2, 2);
    const congelada = await activa(page);
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(congelada);

    await boton.click(); // reanudar (el puntero vuelve a pasar por el carrusel)
    await expect(boton).toHaveAttribute('aria-label', 'Pausar el cambio automático de imágenes');
    await expect(boton).toHaveAttribute('data-pausado', 'false');
    await page.mouse.move(2, 2);
    await page.clock.runFor(AVANCE);
    expect(await activa(page)).toBe((congelada + 1) % 4);
  });

  test('teclado: Enter pausa, mover o sacar el foco no reanuda y Espacio reanuda', async ({ page }) => {
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    await boton.focus();
    await page.keyboard.press('Enter');
    await expect(boton).toHaveAttribute('data-pausado', 'true');
    await page.keyboard.press('Tab'); // el foco pasa a la flecha anterior
    await expect(page.locator('.slider .prev')).toBeFocused();
    const congelada = await activa(page);
    await page.clock.runFor(LARGO);
    expect(await activa(page), 'foco dentro del carrusel').toBe(congelada);

    await page.evaluate(() => (document.activeElement as HTMLElement).blur()); // el foco sale del carrusel: focusout
    await page.clock.runFor(LARGO);
    expect(await activa(page), 'foco fuera del carrusel').toBe(congelada);

    await boton.focus();
    await page.keyboard.press('Space');
    await expect(boton).toHaveAttribute('data-pausado', 'false');
    await page.clock.runFor(AVANCE);
    expect(await activa(page)).toBe((congelada + 1) % 4);
  });

  test('activado sin puntero ni foco (por ejemplo, desde un lector de pantalla) también pausa y reanuda', async ({ page }) => {
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    const inicio = await activa(page);
    await boton.dispatchEvent('click'); // sin mover el puntero ni dar foco: site.js no se enteraría por sí solo
    await expect(boton).toHaveAttribute('data-pausado', 'true');
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(inicio);
    await boton.dispatchEvent('click');
    await expect(boton).toHaveAttribute('data-pausado', 'false');
    await page.clock.runFor(AVANCE);
    expect(await activa(page)).toBe((inicio + 1) % 4);
  });

  test('con pausa, las flechas y los puntos siguen funcionando y no reanudan el avance', async ({ page }) => {
    await abrirConRelojDetenido(page);
    await page.locator('.slider-pausa').click();
    const antes = await activa(page);
    await page.locator('.slider .next').click();
    expect(await activa(page)).toBe((antes + 1) % 4);
    await page.locator('.slider .dots button').nth(0).click();
    expect(await activa(page)).toBe(0);
    await page.mouse.move(2, 2);
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(0);
  });

  test('sin pausar, site.js sigue igual: se detiene con el puntero y reanuda al salir', async ({ page }) => {
    await abrirConRelojDetenido(page);
    await page.locator('#slider').hover();
    const quieta = await activa(page);
    await page.clock.runFor(LARGO);
    expect(await activa(page), 'con el puntero encima no avanza').toBe(quieta);
    await page.mouse.move(2, 2);
    await page.clock.runFor(AVANCE);
    expect(await activa(page), 'al salir el puntero reanuda').toBe((quieta + 1) % 4);
  });

  test('en páginas sin carrusel mejoras.js no hace nada ni da errores', async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto('/contacto/');
    await estable(page);
    await expect(page.locator('.slider-pausa')).toHaveCount(0);
    expect(errores).toEqual([]);
  });

  test('con movimiento reducido no se agrega el botón: site.js no avanza solo, no hay nada que pausar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // antes de navegar; test.use({ reducedMotion }) no lo aplica
    await page.goto('/');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await expect(page.locator('.slider .dots button')).toHaveCount(4);
    await expect(page.locator('.slider-pausa')).toHaveCount(0);
  });

  test.describe('versión publicada', () => {
    test.use({ sitio: 'antes' });
    test('no tiene botón de pausa (punto de partida del hallazgo)', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.slider .dots button')).toHaveCount(4);
      await expect(page.locator('.slider-pausa')).toHaveCount(0);
    });
  });
});
