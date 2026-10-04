/* VYR SEGURITEC · funciones del sitio (v1 · 2026-09-27; version Astro 2026-09-29)
   MEDICION: los IDs se configuran en Cloudflare (Workers > vyrseguritec-web > Settings > Variables):
   PUBLIC_GA4_ID (G-XXXXXXXXXX), PUBLIC_ADS_ID (AW-XXXXXXXXXX),
   PUBLIC_ADS_LABEL_WHATSAPP y PUBLIC_ADS_LABEL_LLAMADA (etiquetas de conversion de Google Ads). */
/* En la version Astro los IDs vienen de las variables de Cloudflare (PUBLIC_GA4_ID, PUBLIC_ADS_ID...)
   y solo se cargan en produccion: la plantilla (Base.astro) los deja en window.VYR_ENV. */
var VYR_ENV = window.VYR_ENV || {};
var VYR_CONFIG = {
  GA4_ID: VYR_ENV.GA4_ID || '',
  ADS_ID: VYR_ENV.ADS_ID || '',
  ADS_LABEL_WHATSAPP: VYR_ENV.ADS_LABEL_WHATSAPP || '',
  ADS_LABEL_LLAMADA: VYR_ENV.ADS_LABEL_LLAMADA || '',
  WHATSAPP: VYR_ENV.WHATSAPP || '51965325162'
};

(function () {
  var C = VYR_CONFIG;
  var PREVIEW = !!window.VYR_PREVIEW;

  /* Etiqueta de Google: solo se carga si hay un ID configurado */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var firstId = C.GA4_ID || C.ADS_ID;
  if (firstId && !PREVIEW) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(firstId);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    if (C.GA4_ID) window.gtag('config', C.GA4_ID);
    if (C.ADS_ID) window.gtag('config', C.ADS_ID);
  }
  function track(kind, extra) {
    if (!firstId || PREVIEW) return;
    var data = extra || {};
    data.page_location = location.href;
    if (kind === 'whatsapp') {
      window.gtag('event', 'whatsapp_click', data);
      if (C.ADS_ID && C.ADS_LABEL_WHATSAPP) window.gtag('event', 'conversion', { send_to: C.ADS_ID + '/' + C.ADS_LABEL_WHATSAPP });
    } else if (kind === 'llamada') {
      window.gtag('event', 'phone_click', data);
      if (C.ADS_ID && C.ADS_LABEL_LLAMADA) window.gtag('event', 'conversion', { send_to: C.ADS_ID + '/' + C.ADS_LABEL_LLAMADA });
    } else if (kind === 'correo') {
      window.gtag('event', 'email_click', data);
    } else {
      window.gtag('event', kind, data);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-evento]') : null;
    if (a) track(a.getAttribute('data-evento'), { link_text: (a.textContent || '').trim().slice(0, 60) });
  });

  /* Menú en móvil */
  var mb = document.querySelector('.menu-btn');
  var mn = document.getElementById('menu-movil');
  if (mb && mn) {
    mb.addEventListener('click', function () {
      var open = mn.hidden;
      mn.hidden = !open;
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Carrusel de la portada */
  var root = document.getElementById('slider');
  if (root) {
    var track2 = root.querySelector('.track');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    var dotsWrap = root.querySelector('.dots');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var i = 0, timer = null, hovering = false, x0 = null;
    slides.forEach(function (sl, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Ver imagen ' + (k + 1));
      b.addEventListener('click', function () { go(k); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);
    var go = function (n) {
      i = (n + slides.length) % slides.length;
      track2.style.transform = 'translateX(' + (-i * 100) + '%)';
      slides.forEach(function (sl, k) { sl.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    };
    var start = function () { if (reduce || timer || hovering || document.hidden) return; timer = setInterval(function () { go(i + 1); }, 5000); };
    var stop = function () { clearInterval(timer); timer = null; };
    var restart = function () { stop(); start(); };
    root.querySelector('.prev').addEventListener('click', function () { go(i - 1); restart(); });
    root.querySelector('.next').addEventListener('click', function () { go(i + 1); restart(); });
    root.addEventListener('mouseenter', function () { hovering = true; stop(); });
    root.addEventListener('mouseleave', function () { hovering = false; start(); });
    root.addEventListener('focusin', function () { hovering = true; stop(); });
    root.addEventListener('focusout', function () { hovering = false; start(); });
    root.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    root.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    go(0);
    start();
  }

  /* Formulario de cotización: arma el mensaje y abre WhatsApp */
  var f = document.getElementById('form-cotizacion');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.checkValidity && !f.checkValidity()) { f.reportValidity(); return; }
      var d = new FormData(f);
      var g = function (k) { return (d.get(k) || '').toString().trim(); };
      var lines = [
        'Hola VYR, quiero cotizar un sistema contra incendio.',
        'Nombre: ' + g('nombre'),
        g('empresa') ? 'Empresa: ' + g('empresa') : '',
        'Teléfono: ' + g('telefono'),
        g('correo') ? 'Correo: ' + g('correo') : '',
        'Ciudad: ' + g('ciudad'),
        'Tipo de local: ' + g('tipo_local'),
        g('area') ? 'Área aproximada: ' + g('area') + ' m²' : '',
        'Servicio: ' + g('servicio'),
        g('mensaje') ? 'Detalle: ' + g('mensaje') : ''
      ].filter(Boolean);
      var url = 'https://wa.me/' + C.WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      track('generate_lead', { servicio: g('servicio'), ciudad: g('ciudad') });
      track('whatsapp');
      var out = document.getElementById('form-resultado');
      var link = document.getElementById('form-wa-link');
      if (link) link.href = url;
      if (out) { out.hidden = false; out.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      if (!PREVIEW) { window.location.href = url; }
    });
  }

  /* Asesoría gratuita (03/10/2026): formulario corto de las páginas de servicio que abre WhatsApp con los datos */
  Array.prototype.forEach.call(document.querySelectorAll('form[data-asesoria]'), function (fa) {
    fa.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fa.checkValidity && !fa.checkValidity()) { fa.reportValidity(); return; }
      var d = new FormData(fa);
      var g = function (k) { return (d.get(k) || '').toString().trim(); };
      var lines = [
        fa.getAttribute('data-asesoria') || 'Hola VYR, quiero una asesoría gratuita.',
        'Nombre: ' + g('nombre'),
        'Celular: ' + g('celular'),
        g('correo') ? 'Correo: ' + g('correo') : '',
        g('consulta') ? 'Consulta: ' + g('consulta') : ''
      ].filter(Boolean);
      var url = 'https://wa.me/' + C.WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      track('generate_lead', { formulario: 'asesoria' });
      track('whatsapp');
      if (!PREVIEW) { window.location.href = url; }
    });
  });

  /* Libro de Reclamaciones: menores de edad, envío con número correlativo y copia imprimible */
  var lr = document.getElementById('form-reclamo');
  if (lr) {
    var menor = document.getElementById('lr-menor');
    var apod = document.getElementById('lr-apoderado');
    if (menor && apod) {
      var sync = function () {
        apod.hidden = !menor.checked;
        Array.prototype.forEach.call(apod.querySelectorAll('input'), function (el) { el.required = menor.checked; });
      };
      menor.addEventListener('change', sync); sync();
    }
    var boxOk = document.getElementById('lr-ok');
    var boxErr = document.getElementById('lr-error');
    var boton = lr.querySelector('button[type="submit"]');
    var textoBoton = boton ? boton.textContent : '';
    var enviando = false;

    /* Copia de la hoja en pantalla, para imprimirla o guardarla en PDF (D.S. 011-2011-PCM, art. 4) */
    var pintarHoja = function (res, g) {
      var hoja = document.getElementById('lr-hoja');
      if (!hoja) return;
      hoja.textContent = '';
      var bloque = function (titulo, filas) {
        var h = document.createElement('h3'); h.textContent = titulo; hoja.appendChild(h);
        var dl = document.createElement('dl');
        filas.forEach(function (f) {
          if (!f[1]) return;
          var dt = document.createElement('dt'); dt.textContent = f[0];
          var dd = document.createElement('dd'); dd.textContent = f[1];
          dl.appendChild(dt); dl.appendChild(dd);
        });
        hoja.appendChild(dl);
      };
      bloque('Hoja de reclamación N.º ' + res.numero, [
        ['Fecha y hora', res.fecha + ' (hora de Lima)'],
        ['Proveedor', 'V Y R SEGURITEC E.I.R.L. · RUC 20565379535'],
        ['Domicilio', 'Av. Carlos Izaguirre 200, Int. 1A6, Independencia, Lima']
      ]);
      bloque('1. Identificación del consumidor reclamante', [
        ['Nombres y apellidos', g('nombres') + ' ' + g('apellidos')],
        [g('tipo_documento'), g('numero_documento')],
        ['Domicilio', g('domicilio') + ' · ' + g('ubigeo')],
        ['Teléfono', g('telefono')],
        ['Correo electrónico', g('correo')],
        ['Padre, madre o apoderado', g('menor_de_edad') ? g('apoderado') : '']
      ]);
      bloque('2. Identificación del bien contratado', [
        ['Bien contratado', g('bien')],
        ['Monto reclamado', g('monto') ? 'S/ ' + g('monto') : ''],
        ['N.º de comprobante', g('comprobante')],
        ['Descripción', g('descripcion')]
      ]);
      bloque('3. Detalle de la reclamación y pedido del consumidor', [
        ['Tipo', g('tipo')], ['Detalle', g('detalle')], ['Pedido', g('pedido')]
      ]);
      bloque('4. Observaciones y acciones adoptadas por el proveedor', [
        ['Respuesta', 'La empresa responde en un plazo no mayor a quince (15) días hábiles' + (res.vence ? ': a más tardar el ' + res.vence + '.' : '.')]
      ]);
    };

    var falla = function (res) {
      enviando = false;
      if (boton) { boton.disabled = false; boton.textContent = textoBoton; }
      var msg = document.getElementById('lr-error-msg');
      if (msg) {
        msg.textContent = res && res.error === 'validacion'
          ? 'Revise los datos del formulario: falta completar un campo obligatorio o el correo no es válido.'
          : 'Inténtelo de nuevo en unos minutos. Sus datos siguen en el formulario.';
      }
      if (boxErr) { boxErr.hidden = false; boxErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };

    lr.addEventListener('submit', function (e) {
      if (PREVIEW) {
        e.preventDefault();
        var prev = document.getElementById('lr-preview');
        if (prev) { prev.hidden = false; prev.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      /* Sin fetch, el navegador envía el formulario de la forma clásica y el servidor responde con una página. */
      if (!window.fetch || !window.URLSearchParams || !boxOk) return;
      e.preventDefault();
      if (lr.checkValidity && !lr.checkValidity()) { lr.reportValidity(); return; }
      if (enviando) return;
      enviando = true;
      if (boton) { boton.disabled = true; boton.textContent = 'Enviando…'; }
      if (boxErr) boxErr.hidden = true;
      var d = new FormData(lr);
      var g = function (k) { return (d.get(k) || '').toString().trim(); };
      var cuerpo = new URLSearchParams();
      d.forEach(function (v, k) { cuerpo.append(k, v.toString()); });
      fetch(lr.getAttribute('action'), {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: cuerpo.toString(),
        credentials: 'omit'
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: 'servicio' }; });
      }).then(function (res) {
        if (!res || !res.ok || !res.numero) { falla(res); return; }
        document.getElementById('lr-num').textContent = res.numero;
        document.getElementById('lr-fecha').textContent = res.fecha;
        document.getElementById('lr-copia').textContent = res.copia
          ? 'Enviamos la copia de su hoja a ' + g('correo') + '. Si no la ve, revise la carpeta de correo no deseado.'
          : 'No pudimos enviar la copia a su correo. Imprima o guarde esta página y escríbanos a vyrseguritec@gmail.com para recibirla.';
        pintarHoja(res, g);
        lr.hidden = true;
        lr.reset();
        boxOk.hidden = false;
        boxOk.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { boxOk.focus({ preventScroll: true }); } catch (x) { /* navegadores antiguos */ }
      }).catch(function () { falla({ error: 'red' }); });
    });

    var imprimir = document.getElementById('lr-imprimir');
    if (imprimir) {
      imprimir.addEventListener('click', function () {
        document.body.classList.add('imprime-hoja');
        window.print();
      });
      window.addEventListener('afterprint', function () { document.body.classList.remove('imprime-hoja'); });
    }
  }

  /* Año en el pie */
  var y = document.getElementById('anio');
  if (y) y.textContent = new Date().getFullYear();
})();


/* Mega-menú de servicios */
(function(){
  var btn=document.querySelector('.mm-btn'), panel=document.getElementById('mega-servicios');
  if(!btn||!panel) return;
  var hover=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var viaHover=false, t=null;
  function open(){clearTimeout(t);panel.hidden=false;btn.setAttribute('aria-expanded','true');}
  function close(){clearTimeout(t);viaHover=false;panel.hidden=true;btn.setAttribute('aria-expanded','false');}
  btn.addEventListener('click',function(e){
    if(panel.hidden){viaHover=false;open();if(e.detail===0){var f=panel.querySelector('a');if(f)f.focus();}}
    else if(viaHover){viaHover=false;}
    else{close();}
  });
  if(hover){
    [btn,panel].forEach(function(el){
      el.addEventListener('mouseenter',function(){clearTimeout(t);if(panel.hidden){viaHover=true;open();}});
      el.addEventListener('mouseleave',function(){if(viaHover){t=setTimeout(close,220);}});
    });
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){close();btn.focus();}});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&!btn.contains(e.target))close();});
  panel.addEventListener('focusout',function(e){var n=e.relatedTarget;if(n&&!panel.contains(n)&&n!==btn)close();});
  panel.addEventListener('click',function(e){if(e.target.closest('a'))close();});
  window.addEventListener('resize',function(){if(window.innerWidth<=1060&&!panel.hidden)close();});
})();


/* Landing de Google Ads: ciudad y servicio desde la URL, p. ej. ?ciudad=arequipa&servicio=rociadores */
(function () {
  var hc = document.getElementById('lp-ciudad'); if (!hc) return;
  var q = new URLSearchParams(location.search);
  var C = { lima: 'Lima y Callao', arequipa: 'Arequipa', trujillo: 'Trujillo', chiclayo: 'Chiclayo', piura: 'Piura', huancayo: 'Huancayo', cusco: 'Cusco', chimbote: 'Chimbote', cajamarca: 'Cajamarca', tacna: 'Tacna', puno: 'Puno', huaraz: 'Huaraz' };
  var S = { rociadores: 'Rociadores contra incendio', bombas: 'Bombas contra incendio', alarma: 'Detección y alarma contra incendio', mantenimiento: 'Mantenimiento de sistemas contra incendio' };
  var c = C[(q.get('ciudad') || '').toLowerCase()], sv = S[(q.get('servicio') || '').toLowerCase()];
  var hs = document.getElementById('lp-servicio');
  if (c) {
    hc.textContent = c;
    var sel = document.getElementById('f-ciudad');
    if (sel) for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === c) sel.selectedIndex = i;
  }
  if (sv && hs) hs.textContent = sv;
  var SF = { rociadores: 'Sistema de agua contra incendio / rociadores', bombas: 'Bomba o cuarto de bombas', alarma: 'Detección y alarma (DACI)', mantenimiento: 'Mantenimiento y certificado de operatividad' };
  var fs = document.getElementById('f-servicio'), k = (q.get('servicio') || '').toLowerCase();
  if (fs && SF[k]) for (var j = 0; j < fs.options.length; j++) if (fs.options[j].text === SF[k]) fs.selectedIndex = j;
  if (c || sv) {
    var msg = 'Hola VYR, vengo de Google y quiero cotizar ' + (sv ? sv.toLowerCase() : 'un sistema contra incendio') + (c ? ' en ' + c : '');
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="https://wa.me/"]'), function (a) {
      a.href = 'https://wa.me/51965325162?text=' + encodeURIComponent(msg);
    });
  }
})();


/* Catálogo de bombas (03/10/2026): filtros por tipo, caudal, presión mínima, motor y marca.
   Los modelos se generan desde src/data/catalogo.ts; aquí solo se muestran u ocultan. Lee #tipo de la URL
   (los enlaces de la portada llegan como /catalogo/bombas-contra-incendio/#vertical-en-linea). */
(function () {
  var grid = document.querySelector('.cat-grid'); if (!grid) return;
  var fichas = Array.prototype.slice.call(grid.querySelectorAll('.placa'));
  var botones = Array.prototype.slice.call(document.querySelectorAll('.cat-tipos button'));
  var sel = { gpm: document.getElementById('cat-gpm'), psi: document.getElementById('cat-psi'), acc: document.getElementById('cat-acc'), marca: document.getElementById('cat-marca') };
  var conteo = document.getElementById('cat-conteo'), vacio = document.getElementById('cat-vacio');
  var form = document.getElementById('cat-filtros');
  var tipo = '';
  function aplicar() {
    var n = 0;
    fichas.forEach(function (f) {
      var ok = (!tipo || f.dataset.tipo === tipo) &&
        (!sel.gpm.value || f.dataset.gpm === sel.gpm.value) &&
        (!sel.psi.value || +f.dataset.psi >= +sel.psi.value) &&
        (!sel.acc.value || f.dataset.acc === sel.acc.value) &&
        (!sel.marca.value || f.dataset.marca === sel.marca.value);
      f.hidden = !ok; if (ok) n++;
    });
    conteo.textContent = n === 1 ? '1 modelo coincide' : n + ' modelos coinciden';
    vacio.hidden = n !== 0;
  }
  function elegirTipo(t) {
    tipo = t;
    botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tipo') === t ? 'true' : 'false'); });
    aplicar();
  }
  botones.forEach(function (b) { b.addEventListener('click', function () { elegirTipo(b.getAttribute('data-tipo')); }); });
  Object.keys(sel).forEach(function (k) { if (sel[k]) sel[k].addEventListener('change', aplicar); });
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); aplicar(); });
  var h = decodeURIComponent((location.hash || '').slice(1));
  if (h && botones.some(function (b) { return b.getAttribute('data-tipo') === h; })) {
    elegirTipo(h);
    var m = document.getElementById('modelos'); if (m) m.scrollIntoView();
  } else {
    aplicar();
  }
})();
