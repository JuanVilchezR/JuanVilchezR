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
const ESCRITORIO = 1060; // por encima de este ancho el sitio muestra el mega-menú de servicios

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
    const punto1 = caja(s.querySelector('.dots button')!);
    const anterior = caja(s.querySelector('.prev')!);
    return {
      primero: s.querySelector('button, a[href], [tabindex]') === b,
      ancho: pb.width,
      alto: pb.height,
      dentro: pb.left >= ps.left && pb.right <= ps.right && pb.top >= ps.top && pb.bottom <= ps.bottom,
      choquesControles: controles.filter((o) => cruza(pb, o)).length, // las áreas de toque no se pisan
      choquesTexto: textos.filter((o) => cruza(icono, o)).length, // el icono no tapa el título ni la descripción
      alineadoConPuntos: punto1.width === 0 || Math.abs(pb.bottom - punto1.bottom) < 0.5, // misma fila que los puntos
      alineadoConFlechas: innerWidth > 520 || Math.abs(pb.bottom - anterior.bottom) < 0.5, // en celular, también que las flechas
      iconos: [getComputedStyle(b.querySelector('.i-pausa')!).opacity, getComputedStyle(b.querySelector('.i-play')!).opacity],
      nombre: b.getAttribute('aria-label'),
      titulo: b.getAttribute('title'),
      tipo: b.getAttribute('type'),
      cursor: getComputedStyle(b).cursor,
    };
  });

  test('es el primer control del carrusel, mide 44 px, se anuncia y muestra un solo icono', async ({ page }) => {
    await page.goto('/');
    await estable(page);
    const r = await medir(page);
    expect(r).not.toBeNull();
    expect(r).toMatchObject({
      primero: true, dentro: true, tipo: 'button', cursor: 'pointer', titulo: null, // sin title: duplicaría el nombre accesible
      alineadoConPuntos: true, alineadoConFlechas: true, iconos: ['1', '0'],
    });
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
    // 280 px es una pantalla plegada; hasta 315 px los puntos se ocultan porque ya no caben junto al botón y las flechas
    for (const ancho of [280, 290, 300, 310, 315, 316, 318, 320, 340, 360, 375, 390, 414, 430, 480, 520]) {
      await page.setViewportSize({ width: ancho, height: 800 });
      await estable(page);
      const r = await page.evaluate(() => {
        const s = document.querySelector('#slider')!;
        const puntos = [...s.querySelectorAll('.dots button')].map((b) => b.getBoundingClientRect()).filter((c) => c.width > 0);
        const cajas: [string, DOMRect][] = [
          ['pausa', s.querySelector('.slider-pausa')!.getBoundingClientRect()],
          ['anterior', s.querySelector('.prev')!.getBoundingClientRect()],
          ['siguiente', s.querySelector('.next')!.getBoundingClientRect()],
          ...puntos.map((c, i): [string, DOMRect] => [`punto ${i + 1}`, c]),
        ];
        const cruza = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom && a.bottom > b.top;
        const choques: string[] = [];
        for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) if (cruza(cajas[i][1], cajas[j][1])) choques.push(`${cajas[i][0]} y ${cajas[j][0]}`);
        return { choques, puntosVisibles: puntos.length, puntoMasAngosto: puntos.length ? Math.min(...puntos.map((c) => c.width)) : -1 };
      });
      expect(r.choques, `${ancho} px`).toEqual([]);
      if (ancho <= 315) {
        expect(r.puntosVisibles, `${ancho} px`).toBe(0);
      } else {
        expect(r.puntosVisibles, `${ancho} px`).toBe(4);
        expect(r.puntoMasAngosto, `${ancho} px`).toBeGreaterThanOrEqual(25.5);
      }
    }
  });

  test('foco visible: anillo blanco dentro del botón, sin subir hasta el texto del pie', async ({ page }) => {
    await page.goto('/');
    await estable(page);
    await page.locator('.slider-pausa').focus();
    const r = await page.evaluate(() => {
      const b = document.querySelector('.slider-pausa') as HTMLElement;
      const cs = getComputedStyle(b);
      const caja = b.getBoundingClientRect();
      const d = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth); // borde exterior del anillo respecto del botón (negativo: hacia dentro)
      const anillo = { left: caja.left - d, right: caja.right + d, top: caja.top - d, bottom: caja.bottom + d };
      const textos = [...document.querySelectorAll('#slider .slide[aria-hidden="false"] figcaption b, #slider .slide[aria-hidden="false"] figcaption span')].map((e) => e.getBoundingClientRect());
      const choques = textos.filter((t) => anillo.left < t.right && anillo.right > t.left && anillo.top < t.bottom && anillo.bottom > t.top).length;
      return { estilo: cs.outlineStyle, color: cs.outlineColor, d, choques };
    });
    expect(r).toMatchObject({ estilo: 'solid', color: 'rgb(255, 255, 255)', choques: 0 });
    expect(r.d).toBeLessThanOrEqual(0); // el anillo no sobresale del botón: no se recorta contra el borde del carrusel
  });

  test('pausa: la diapositiva deja de cambiar, no se reanuda al salir el puntero y el icono cambia', async ({ page }) => {
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    const inicio = await activa(page);
    await page.clock.runFor(AVANCE);
    expect(await activa(page), 'sin pausa, avanza sola').toBe((inicio + 1) % 4);

    await boton.click(); // el puntero queda sobre el carrusel
    await expect(boton).toHaveAttribute('aria-label', 'Reanudar el cambio automático de imágenes');
    await expect(boton).toHaveAttribute('data-pausado', 'true');
    // un solo icono a la vez: la transición de opacidad dura 0,16 s en tiempo real
    await expect.poll(() => boton.evaluate((e) => [getComputedStyle(e.querySelector('.i-pausa')!).opacity, getComputedStyle(e.querySelector('.i-play')!).opacity])).toEqual(['0', '1']);
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
    await expect.poll(() => boton.evaluate((e) => [getComputedStyle(e.querySelector('.i-pausa')!).opacity, getComputedStyle(e.querySelector('.i-play')!).opacity])).toEqual(['1', '0']);
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

    await page.keyboard.press('Shift+Tab'); // y de vuelta al botón
    await expect(boton).toBeFocused();
    await page.clock.runFor(LARGO);
    expect(await activa(page), 'foco de vuelta en el botón').toBe(congelada);

    await page.evaluate(() => (document.activeElement as HTMLElement).blur()); // el foco sale del carrusel: focusout
    await page.clock.runFor(LARGO);
    expect(await activa(page), 'foco fuera del carrusel').toBe(congelada);

    await boton.focus();
    await page.keyboard.press('Space');
    await expect(boton).toHaveAttribute('data-pausado', 'false');
    await page.clock.runFor(AVANCE);
    expect(await activa(page)).toBe((congelada + 1) % 4);
  });

  test('táctil: tocar el botón pausa, tocar fuera no reanuda y volver a tocarlo reanuda', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'solo pantallas táctiles');
    await abrirConRelojDetenido(page);
    const boton = page.locator('.slider-pausa');
    await boton.tap();
    await expect(boton).toHaveAttribute('data-pausado', 'true');
    await page.touchscreen.tap(2, 2); // toque fuera del carrusel: el navegador envía mouseleave
    const congelada = await activa(page);
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(congelada);

    await boton.tap();
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

  test('con pausa, cambiar de pestaña y volver no reanuda el avance', async ({ page }) => {
    await abrirConRelojDetenido(page);
    await page.locator('.slider-pausa').click();
    await page.mouse.move(2, 2);
    const congelada = await activa(page);
    const ocultar = (oculto: boolean) => page.evaluate((o) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => o });
      document.dispatchEvent(new Event('visibilitychange')); // site.js reanuda al volver a ser visible
    }, oculto);
    await ocultar(true);
    await ocultar(false);
    await page.clock.runFor(LARGO);
    expect(await activa(page)).toBe(congelada);
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

  test.describe('no interfiere con otros manejadores del sitio', () => {
    // El interceptor solo debe retener los eventos del propio carrusel; el mega-menú de servicios
    // (site.js) también se cierra con mouseleave y focusout y no debe quedar abierto.
    test('con el carrusel en pausa, el mega-menú se sigue cerrando al salir el puntero', async ({ page, viewport }) => {
      test.skip((viewport?.width ?? 0) <= ESCRITORIO, 'el mega-menú solo existe en escritorio');
      await abrirConRelojDetenido(page);
      await page.locator('.slider-pausa').click();
      const panel = page.locator('#mega-servicios');
      await page.locator('.mm-btn').hover();
      await expect(panel).toBeVisible();
      await page.mouse.move(2, 2); // fuera del botón y del panel (que cuelga debajo de la cabecera)
      await page.clock.runFor(400); // el cierre espera 220 ms
      await expect(panel).toBeHidden();
    });

    test('con el carrusel en pausa, el mega-menú se sigue cerrando al sacar el foco', async ({ page, viewport }) => {
      test.skip((viewport?.width ?? 0) <= ESCRITORIO, 'el mega-menú solo existe en escritorio');
      await abrirConRelojDetenido(page);
      await page.locator('.slider-pausa').click();
      await page.locator('.mm-btn').focus();
      await page.keyboard.press('Enter'); // abre y enfoca el primer enlace del panel
      await expect(page.locator('#mega-servicios')).toBeVisible();
      await page.locator('.hero a').first().focus(); // foco fuera del panel
      await expect(page.locator('#mega-servicios')).toBeHidden();
    });

    test('un focusout o mouseleave sintético sobre window con la pausa activa no produce errores', async ({ page }) => {
      const errores = vigilarErrores(page);
      await abrirConRelojDetenido(page);
      await page.locator('.slider-pausa').click();
      await page.evaluate(() => {
        window.dispatchEvent(new FocusEvent('focusout'));
        window.dispatchEvent(new MouseEvent('mouseleave'));
        document.dispatchEvent(new FocusEvent('focusout'));
      });
      expect(errores).toEqual([]);
    });
  });

  test('en páginas sin carrusel mejoras.js no hace nada ni da errores', async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto('/contacto/');
    await estable(page);
    await expect(page.locator('.slider-pausa')).toHaveCount(0);
    expect(errores).toEqual([]);
  });

  test('si falta mejoras.css el botón no se muestra: no queda un control sin estilo empujando el carrusel', async ({ page }) => {
    await page.route(/\/assets\/mejoras\.css/, (r) => r.fulfill({ status: 404, body: '' })); // la ruta de la página manda sobre la del contexto; con regex porque la portada lleva ?v=
    await page.goto('/');
    await expect(page.locator('.slider .dots button')).toHaveCount(4);
    await expect(page.locator('.slider-pausa')).toHaveCount(0);
    await expect(page.locator('#slider')).not.toHaveClass(/con-pausa/);
  });

  test('con colores forzados de Windows los puntos se ven y el activo se distingue', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.slider .dots button')).toHaveCount(4);
    const c = await page.evaluate(() => {
      const puntos = [...document.querySelectorAll('.slider .dots button')];
      const fondo = (b: Element | undefined) => getComputedStyle(b!, '::before').backgroundColor;
      return {
        activo: fondo(puntos.find((b) => b.getAttribute('aria-selected') === 'true')),
        otro: fondo(puntos.find((b) => b.getAttribute('aria-selected') !== 'true')),
        carrusel: getComputedStyle(document.querySelector('.slider')!).backgroundColor,
      };
    });
    expect(c.otro, 'los puntos inactivos contrastan con el fondo del carrusel').not.toBe(c.carrusel);
    expect(c.activo, 'el punto activo se distingue de los demás').not.toBe(c.otro);
    expect(c.activo).not.toBe(c.carrusel);
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
