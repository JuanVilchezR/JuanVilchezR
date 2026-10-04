/* VYR SEGURITEC · mejoras.js (opcional, 04/10/2026)
   Botón para pausar y reanudar el carrusel de la portada (WCAG 2.2.2, nivel A: el avance cada 5 s
   debe poder detenerse). Se carga con defer DESPUÉS de site.js y necesita mejoras.css (sus estilos;
   si falta, el botón no se muestra). No toca site.js: usa los mismos eventos con los que ese archivo
   ya detiene y reanuda el avance (mouseenter para detener, mouseleave para reanudar). En páginas sin
   carrusel no hace nada. El botón refleja la elección del visitante, no el temporizador: el avance
   también se detiene solo con el puntero o el foco encima, como antes.
   Para revertir, quita este script; el carrusel vuelve a ser el de siempre. */
(function () {
  'use strict';
  var root = document.getElementById('slider');
  if (!root || !root.querySelector('.track')) return;
  /* Con movimiento reducido site.js no inicia el avance: no hay nada que pausar */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var etiquetas = ['Pausar el cambio automático de imágenes', 'Reanudar el cambio automático de imágenes'];
  var pausado = false;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'slider-pausa';
  btn.innerHTML =
    '<svg class="i-pausa" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3" y="2.5" width="3.5" height="11" rx="1"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1"/></svg>' +
    '<svg class="i-play" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 2.8v10.4L13.5 8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var pintar = function () {
    btn.setAttribute('aria-label', etiquetas[pausado ? 1 : 0]);
    btn.setAttribute('data-pausado', pausado ? 'true' : 'false');
  };
  pintar();
  root.classList.add('con-pausa'); /* mejoras.css corre los puntos para dejarle sitio */
  root.insertBefore(btn, root.firstChild); /* primer control del carrusel en el orden del teclado */
  /* Sin mejoras.css el botón saldría sin estilo y empujaría el carrusel: mejor no mostrarlo */
  if (window.getComputedStyle(btn).position !== 'absolute') {
    root.removeChild(btn);
    root.classList.remove('con-pausa');
    return;
  }

  /* Mientras el visitante lo tiene en pausa, salir con el puntero o con el foco no debe reanudarlo.
     Se intercepta en la fase de captura (window), así no importa en qué orden se cargaron los scripts. */
  var retener = function (e) {
    if (!pausado || !(e.target instanceof Node)) return;
    if (e.type === 'mouseleave' ? e.target === root : root.contains(e.target)) e.stopPropagation();
  };
  window.addEventListener('mouseleave', retener, true);
  window.addEventListener('focusout', retener, true);

  btn.addEventListener('click', function () {
    pausado = !pausado;
    root.dispatchEvent(new MouseEvent(pausado ? 'mouseenter' : 'mouseleave'));
    pintar();
  });
})();
