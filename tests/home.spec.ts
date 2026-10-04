import { test, expect, estable, cargarPerezosas, vigilarErrores, contraste } from './support/fixtures';

const MOVIL = 760; // el sitio cambia a barra inferior y menú móvil por debajo de este ancho

test.describe('portada: carga y estabilidad', () => {
  test('carga sin errores de consola ni de red', async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto('/');
    await cargarPerezosas(page);
    await estable(page);
    expect(errores).toEqual([]);
  });

  test('no hay desplazamiento horizontal', async ({ page }) => {
    await page.goto('/');
    await cargarPerezosas(page);
    await estable(page);
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
  });

  test('el título, los textos clave y los campos del formulario no cambian', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Sistemas contra incendio para empresas en Lima y todo el Perú');
    const campos = await page.locator('#form-cotizacion [name]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
    expect(campos).toEqual(['nombre', 'telefono', 'empresa', 'ciudad', 'tipo_local', 'servicio', 'mensaje']);
    // los eventos de analítica siguen en sus enlaces
    expect(await page.locator('[data-evento="whatsapp"]').count()).toBeGreaterThanOrEqual(15);
    expect(await page.locator('[data-evento="llamada"]').count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe('portada: formulario de cotización', () => {
  test('arma el mensaje y abre WhatsApp con los datos', async ({ page }) => {
    await page.goto('/');
    await page.fill('#f-nombre', 'Juan Pérez');
    await page.fill('#f-telefono', '999 888 777');
    await page.fill('#f-empresa', 'Almacenes del Sur SAC');
    await page.selectOption('#f-ciudad', 'Arequipa');
    await page.selectOption('#f-tipo', 'Planta industrial o taller');
    await page.selectOption('#f-servicio', 'Bomba o cuarto de bombas');
    await page.fill('#f-mensaje', '1200 m², techo a 9 m');
    await Promise.all([page.waitForURL(/wa\.me\/51965325162\?text=/), page.locator('#form-cotizacion button[type=submit]').click()]);
    const texto = new URL(page.url()).searchParams.get('text') ?? '';
    for (const linea of ['Hola VYR, quiero cotizar un sistema contra incendio.', 'Nombre: Juan Pérez', 'Empresa: Almacenes del Sur SAC', 'Teléfono: 999 888 777', 'Ciudad: Arequipa', 'Tipo de local: Planta industrial o taller', 'Servicio: Bomba o cuarto de bombas', 'Detalle: 1200 m², techo a 9 m']) {
      expect(texto).toContain(linea);
    }
  });

  test('sin datos no envía: marca el campo con error y lo deja con foco', async ({ page }) => {
    await page.goto('/');
    await page.locator('#form-cotizacion button[type=submit]').click();
    await expect(page).toHaveURL(/vyrseguritec\.com\.pe\/$/);
    await expect(page.locator('#f-nombre')).toBeFocused();
    await expect(page.locator('#f-nombre')).toHaveCSS('border-top-color', 'rgb(183, 28, 28)'); // --red-dk de :user-invalid (espera la transición)
  });
});

test.describe('portada: navegación y componentes', () => {
  test('menú móvil abre y cierra', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) > 1060, 'el menú móvil solo existe hasta 1060 px');
    await page.goto('/');
    const boton = page.locator('.menu-btn');
    await boton.click();
    await expect(page.locator('#menu-movil')).toBeVisible();
    await expect(boton).toHaveAttribute('aria-expanded', 'true');
    await boton.click();
    await expect(page.locator('#menu-movil')).toBeHidden();
  });

  test('megamenú de servicios abre con clic y cierra con Escape', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) <= 1060, 'el megamenú solo existe en escritorio');
    await page.goto('/');
    await page.locator('.mm-btn').click();
    await expect(page.locator('#mega-servicios')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mega-servicios')).toBeHidden();
  });

  test('preguntas frecuentes: cada pregunta se abre sin cerrar las otras y el signo gira', async ({ page }) => {
    await page.goto('/');
    const preguntas = page.locator('#preguntas details');
    await expect(preguntas.first()).toHaveAttribute('open', '');
    await preguntas.nth(1).locator('summary').click();
    await expect(preguntas.nth(1)).toHaveAttribute('open', '');
    await expect(preguntas.first()).toHaveAttribute('open', '');
    const giro = await preguntas.nth(1).locator('summary').evaluate((e) => getComputedStyle(e, '::after').transform);
    expect(giro).not.toBe('none'); // rotate(45deg)
  });

  test('carrusel: avanza, retrocede y actualiza el estado accesible', async ({ page }) => {
    await page.goto('/');
    const slides = page.locator('.slider .slide');
    await expect(page.locator('.slider .dots button')).toHaveCount(4);
    await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false');
    await page.locator('.slider .next').click();
    await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.slider .dots button').nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.locator('.slider .prev').click();
    await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false');
  });

  test('la tarjeta de servicio completa es un enlace y sus sub-enlaces siguen activos', async ({ page }) => {
    await page.goto('/');
    // force: el enlace extendido de la tarjeta cubre la foto; el clic real debe llegar a ese enlace
    await page.locator('.svc-card').first().locator('.ph').click({ force: true });
    await expect(page).toHaveURL(/\/servicios\/sistema-de-agua-contra-incendio\/$/);
    await page.goBack();
    await page.locator('.svc-card').first().getByRole('link', { name: 'Rociadores automáticos' }).click();
    await expect(page).toHaveURL(/\/servicios\/rociadores-contra-incendio\/$/);
  });

  test('la celda de "soluciones" completa enlaza a su página y "Consultar mi caso" va a WhatsApp', async ({ page }) => {
    await page.goto('/');
    await page.locator('.sector').first().locator('p').click({ force: true });
    await expect(page).toHaveURL(/\/soluciones\/almacenes-y-centros-de-distribucion\/$/);
    await page.goBack();
    await Promise.all([page.waitForURL(/wa\.me\/51965325162/), page.locator('.sector').first().getByRole('link', { name: 'Consultar mi caso' }).click()]);
  });

  test('transición entre páginas: la cabecera tiene nombre de transición y navegar no da errores', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) <= 1060, 'se navega por el menú de escritorio');
    const errores = vigilarErrores(page);
    await page.goto('/');
    expect(await page.locator('header.top').evaluate((e) => getComputedStyle(e).viewTransitionName)).toBe('cabecera');
    await page.locator('nav.main').getByRole('link', { name: 'Nosotros' }).click();
    await expect(page).toHaveURL(/\/nosotros\/$/);
    expect(errores).toEqual([]);
  });
});

test.describe('portada: ergonomía y accesibilidad de uso', () => {
  test('áreas táctiles de al menos 44 px en celular', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) > MOVIL, 'solo celular');
    await page.goto('/');
    await estable(page);
    const selectores = ['.menu-btn', 'header .btn-wa', '.hero .ctas .btn', '.mobile-bar .btn', '.quote-card input:not([type=hidden])', '.quote-card select', '.quote-card button[type=submit]', '.slider .arrow', '.slider .dots button', '#preguntas summary', '.svc-card ul a', '.sector .acciones a'];
    const pequenos: string[] = [];
    for (const sel of selectores) {
      // En 320 px los 4 puntos del carrusel miden 36 px de ancho para no pisar las flechas (siguen siendo de 44 px de alto)
      const minAncho = sel === '.slider .dots button' && (viewport?.width ?? 0) <= 360 ? 35.5 : 43.5;
      for (const el of await page.locator(sel).all()) {
        const caja = await el.boundingBox();
        if (caja && (caja.height < 43.5 || caja.width < minAncho)) pequenos.push(`${sel}: ${Math.round(caja.width)}x${Math.round(caja.height)}`);
      }
    }
    expect(pequenos).toEqual([]);
  });

  test('en laptop de 1366x768 el formulario completo cabe en la primera pantalla', async ({ page, viewport }) => {
    test.skip(!(viewport && viewport.width === 1366), 'solo laptop 1366x768');
    await page.goto('/');
    await estable(page);
    const caja = await page.locator('#form-cotizacion button[type=submit]').boundingBox();
    expect(caja!.y + caja!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('foco visible: blanco sobre superficies oscuras, rojo sobre claras', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) <= MOVIL, 'el orden de foco se verifica en escritorio');
    await page.goto('/');
    const anillo = async (sel: string) => {
      await page.locator(sel).first().focus();
      return page.locator(sel).first().evaluate((e) => { const c = getComputedStyle(e); return { estilo: c.outlineStyle, ancho: c.outlineWidth, color: c.outlineColor }; });
    };
    const oscuro = await anillo('.hero .ctas .btn-wa');
    expect(oscuro).toMatchObject({ estilo: 'solid', color: 'rgb(255, 255, 255)' });
    const claro = await anillo('#f-nombre');
    expect(claro).toMatchObject({ estilo: 'solid', color: 'rgb(211, 47, 47)' });
    const faq = await anillo('#preguntas summary');
    expect(faq).toMatchObject({ estilo: 'solid', color: 'rgb(211, 47, 47)' });
    const pie = await anillo('footer.site a');
    expect(pie).toMatchObject({ estilo: 'solid', color: 'rgb(255, 255, 255)' });
  });

  test('contraste: botones de WhatsApp y de cotizar pasan AA con texto blanco', async ({ page }) => {
    await page.goto('/');
    const pares = await page.evaluate(() => ['.hero .ctas .btn-wa', '.quote-card .btn-wa', '.mobile-bar .btn-red', '.cat-home-pie .btn-red'].map((sel) => {
      const e = document.querySelector(sel) as HTMLElement; const c = getComputedStyle(e);
      return { sel, fondo: c.backgroundColor, texto: c.color };
    }));
    for (const p of pares) expect(contraste(p.texto, p.fondo), p.sel).toBeGreaterThanOrEqual(4.5);
  });

  test('en laptop con 650 px útiles el botón de WhatsApp del héroe se ve completo', async ({ page, viewport }) => {
    test.skip(!(viewport && viewport.width === 1366), 'solo laptop');
    await page.setViewportSize({ width: 1366, height: 650 });
    await page.goto('/');
    await estable(page);
    const caja = await page.locator('.hero .ctas .btn-wa').boundingBox();
    expect(caja!.y + caja!.height).toBeLessThanOrEqual(650);
  });

  test('carrusel en celular: las flechas y los puntos no tapan el título ni la descripción', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) > 520, 'solo celular');
    await page.goto('/');
    await estable(page);
    for (let i = 0; i < 4; i++) {
      const choques = await page.evaluate(() => {
        const s = document.querySelector('.slider')!;
        const activo = s.querySelector('.slide[aria-hidden="false"]')!;
        const textos = [...activo.querySelectorAll('figcaption b, figcaption span')].map((e) => e.getBoundingClientRect());
        const controles = [...s.querySelectorAll('.arrow, .dots button')].map((e) => e.getBoundingClientRect());
        const cruza = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return textos.flatMap((t) => controles.filter((c) => cruza(t, c))).length;
      });
      expect(choques, `diapositiva ${i + 1}`).toBe(0);
      await page.locator('.slider .next').click();
      await page.waitForTimeout(750); // el carrusel tarda 0,6 s en desplazarse
    }
  });

  test('al pasar el puntero las tarjetas no se desplazan (sin temblor) y ganan sombra', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) <= 1060, 'el puntero fino solo se prueba en escritorio');
    await page.goto('/');
    await estable(page);
    const tarjeta = page.locator('.svc-card').first();
    await tarjeta.scrollIntoViewIfNeeded();
    const antes = await tarjeta.boundingBox();
    expect(await tarjeta.evaluate((e) => getComputedStyle(e).boxShadow)).toBe('none');
    await page.mouse.move(antes!.x + antes!.width / 2, antes!.y + antes!.height - 2); // borde inferior: donde temblaba
    await page.waitForTimeout(400);
    const durante = await tarjeta.boundingBox();
    expect(Math.abs(durante!.y - antes!.y)).toBeLessThan(0.5);
    expect(await tarjeta.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe('none');
  });

  test('tablet: la última celda de soluciones ocupa todo el ancho (sin hueco gris)', async ({ page, viewport }) => {
    test.skip(!(viewport && viewport.width > 580 && viewport.width <= 900), 'solo tablet');
    await page.goto('/');
    await estable(page);
    const m = await page.evaluate(() => ({ grilla: document.querySelector('.sector-grid')!.getBoundingClientRect().width, ultima: document.querySelector('.sector:last-child')!.getBoundingClientRect().width }));
    expect(m.ultima).toBeGreaterThanOrEqual(m.grilla - 3);
  });
});

test.describe('portada: movimiento', () => {
  test('con movimiento reducido no hay animaciones y todo es visible', async ({ browser, sitio, viewport, isMobile, hasTouch }) => {
    const ctx = await browser.newContext({ viewport: viewport!, isMobile, hasTouch, reducedMotion: 'reduce' });
    const { montarSitio } = await import('./support/site.mjs');
    await montarSitio(ctx, sitio);
    const page = await ctx.newPage();
    await page.goto('/');
    await estable(page);
    const r = await page.evaluate(() => ({
      animaciones: document.getAnimations().filter((a) => a instanceof CSSAnimation).length,
      formulario: getComputedStyle(document.querySelector('.quote-card')!).opacity,
      tarjeta: getComputedStyle(document.querySelector('.post-card')!).opacity,
    }));
    expect(r).toEqual({ animaciones: 0, formulario: '1', tarjeta: '1' });
    await ctx.close();
  });

  test('entrada del héroe: la ficha y los accesos entran; el título (LCP) no se anima', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForFunction(() => (document.querySelector('.quote-card')?.getAnimations().length ?? 0) > 0);
    expect(await page.locator('h1').evaluate((e) => e.getAnimations().length)).toBe(0);
    expect(await page.locator('.hero .lead').evaluate((e) => e.getAnimations().length)).toBe(0);
    await estable(page);
    const fin = await page.locator('.quote-card').evaluate((e) => { const c = getComputedStyle(e); return { opacidad: c.opacity, transform: c.transform }; });
    expect(fin.opacidad).toBe('1');
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(fin.transform);
  });

  test('nada queda "fantasma": tras la carga, el contenido bajo el pliegue tiene opacidad 1', async ({ page }) => {
    await page.goto('/');
    await estable(page);
    const opacidades = await page.evaluate(() => ['.svc-card', '.steps li', '.post-card', '.cat-home a', '.calc', '.sector', '.faq details'].map((s) => [s, +getComputedStyle(document.querySelector(s)!).opacity]));
    expect(opacidades.filter(([, o]) => o !== 1)).toEqual([]);
  });

  test('sombra de la cabecera al desplazarse y botón flotante de WhatsApp tras el héroe (escritorio)', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) <= MOVIL, 'en celular el botón flotante lo reemplaza la barra inferior');
    test.skip(!(await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))), 'sin animaciones ligadas al scroll');
    await page.goto('/');
    await estable(page);
    expect(await page.locator('header.top').evaluate((e) => getComputedStyle(e).boxShadow)).toMatch(/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)$/);
    expect(await page.locator('.wa-float').evaluate((e) => getComputedStyle(e).visibility)).toBe('hidden');
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.locator('header.top').evaluate((e) => getComputedStyle(e).boxShadow)).not.toMatch(/^(none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)$/);
    await expect.poll(() => page.locator('.wa-float').evaluate((e) => getComputedStyle(e).visibility)).toBe('visible');
  });
});
