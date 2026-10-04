// WCAG 2.4.11 (AA, foco no oculto): al recibir el foco por teclado, un control no puede quedar TOTALMENTE oculto
// por contenido fijo o pegajoso (cabecera, barra inferior de contacto).
// Se muestrea cada fragmento de línea del control (un enlace en línea que se parte en dos renglones tiene dos) en
// 3 × 3 puntos de la parte visible. Solo cuenta como oculto si TODOS los puntos caen sobre un elemento ajeno que vive
// dentro de un contenedor fixed o sticky (el botón flotante de WhatsApp se tolera: es lo único que debe flotar).
// La función se serializa y corre dentro de la página, por eso no puede usar nada de fuera.

/** Corre en la página: devuelve "control tapado por contenedor" por cada control totalmente oculto. */
export async function focoTapadoEnPagina(max) {
  const visible = (e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const fijo = (e) => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return n; } return null; };
  const nombre = (e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`;
  const controles = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex="0"]')]
    .filter((e) => visible(e) && !e.closest('.skip,[hidden],[inert]') && !(e.closest('details:not([open])') && e.tagName !== 'SUMMARY'))
    .slice(0, max);
  const tapados = [];
  for (const e of controles) {
    e.focus();
    await new Promise((r) => requestAnimationFrame(r));
    const puntos = [];
    for (const r of e.getClientRects()) {
      const x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, innerHeight);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.15, 0.5, 0.85]) puntos.push([x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy]);
    }
    if (!puntos.length) continue; // fuera de la ventana: el navegador no lo desplazó, no hay nada que juzgar
    let tapadoPor = null;
    const todos = puntos.every(([x, y]) => {
      const arriba = document.elementFromPoint(x, y);
      if (!arriba || e === arriba || e.contains(arriba) || arriba.contains(e)) return false;
      const f = fijo(arriba);
      if (!f || f.contains(e) || f.closest('.wa-float')) return false;
      tapadoPor = f; return true;
    });
    if (todos && tapadoPor) tapados.push(`${nombre(e)} tapado por ${nombre(tapadoPor)}`);
  }
  window.scrollTo(0, 0);
  return tapados;
}

export const focoTapado = (page, max = 80) => page.evaluate(focoTapadoEnPagina, max);
