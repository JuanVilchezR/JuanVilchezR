# Auditoría técnica – www.vyrseguritec.com (home y /cotizar/)

Fecha: 2026-10-04 · Método: HTML renderizado (Firecrawl), robots, sitemap, JSON-LD y detector de la skill `impeccable`.
Alcance y límites: no se probó en navegador real (el proxy de la sesión bloquea el dominio), así que **no hay medición de LCP/CLS, contraste renderizado ni gestos táctiles**. El sitio es WordPress y no está en este repo: los cambios de abajo se aplican en WP, no aquí.

## Puntaje

| # | Dimensión | Nota | Hallazgo clave |
|---|---|---|---|
| 1 | Accesibilidad | 2/4 | Formulario sin `<label>` (solo placeholder); sin skip link ni `<nav>` |
| 2 | Rendimiento | 2/4 | 45 scripts, 22 CSS, jQuery + Slider Revolution + reCAPTCHA doble en todas las páginas |
| 3 | Responsive | ?/4 | Sin evidencia (no probado). Hero con 3 CTA compitiendo |
| 4 | Theming | 2/4 | Tokens `--vyr-red` existen, pero conviven con presets de WP; sin modo oscuro (aceptable) |
| 5 | Integridad | 3/4 | Sistema coherente de marca; contenido y SEO sólidos |
| | **Total** | **~9/16 medido** | Aceptable: la base de contenido/SEO es buena, la capa técnica pesa |

El detector marcó "blanco sobre blanco" 1:1: **falso positivo** (analizó HTML sin CSS/JS aplicado). Verificar con navegador antes de actuar.

## Prioridad alta

1. **Dos propiedades GA4 cargadas a la vez** (`G-KJ00DFB0B9` y `G-1Z1WK4DY65`) → eventos duplicados. Dejar una (o gestionar ambas por un solo tag).
2. **Formulario sin etiquetas**: nombre, WhatsApp, servicio, ciudad y mensaje solo tienen `placeholder`. Agregar `<label>` visible o `aria-label`; el placeholder desaparece al escribir. Botón "Solicitar cotización" nace `disabled` hasta aceptar privacidad: indicar el motivo con texto, no solo estado inactivo.
3. **JSON-LD duplicado**: dos nodos con el mismo `@id` `#organization` (uno `LocalBusiness`, otro `Organization` de Yoast) con logos distintos (`logo-vyrs.webp` vs `logo-vyr-seguritec-512.png`). Unificar en un solo nodo `LocalBusiness` y enlazar `WebSite`/`WebPage` a él. Agregar `sameAs` (Facebook, etc.) y `geo`.
4. **Peso de scripts**: Slider Revolution + jQuery UI + reCAPTCHA v3 (cargado dos veces: `recaptcha__en.js` ×2 y `api.js?render=`) en todas las páginas. Cargar reCAPTCHA solo en páginas con formulario; si el hero es estático, quitar Slider Revolution.

## Prioridad media

5. **Fuentes**: Montserrat y Bebas Neue en 8 pesos vía Google Fonts sin `preconnect` ni `preload`. Reducir a 3–4 pesos usados, autoalojar y precargar el peso del H1.
6. **Imágenes**: `serv-vyr1.webp` y `sub-sv-1.webp` (bajo el pliegue) sin `loading="lazy"`. Logo del header sin prioridad. El hero sí tiene `fetchpriority="high"` (bien).
7. **Accesibilidad estructural**: sin skip link, 0 `<nav>`, sin landmark de menú. Primer H2 genérico ("VYR SEGURITEC"): cambiarlo a algo con intención ("Ingeniería contra incendio desde 2014").
8. **Hero con 3 CTA** (WhatsApp, formulario, brochure) + formulario al lado: jerarquizar. Un primario (WhatsApp o formulario), brochure como enlace secundario.
9. **Prueba social sin evidencia**: "+200 clientes" y "+500 hogares protegidos" sin logos, obras ni casos. "Hogares" además choca con el posicionamiento industrial/comercial. Confirmar la cifra con Juan Carlos antes de mantenerla; agregar 3–6 obras con foto, área, sistema y ciudad (con permiso del cliente).
10. **/cotizar/** declara `og:type = article`; debe ser `website`.
11. **Dirección visible**: el schema trae Av. Carlos Izaguirre N.° 200 Int. 1A6, Independencia; verificar que aparezca igual en el footer (coherencia NAP para SEO local).

## Lo que está bien (conservar)

- Title ~60 y meta description ~155 caracteres, canonical, `lang="es"`, robots y sitemap correctos.
- FAQPage en JSON-LD, 14 imágenes con `alt` descriptivo, WhatsApp/tel/mail enlazados, Libro de Reclamaciones, política de privacidad, un solo H1.
- Cobertura de contenido: página por sistema y por ciudad, guías de A.130/NFPA/ITSE.
- "+11 años (desde 2014)": correcto hoy (fundación 2014-12-22); **pasa a +12 en dic-2026**. Calcular automáticamente.

## Snippets listos (WordPress → Code Snippets / functions.php)

```php
// Cargar reCAPTCHA solo donde hay formulario CF7 (home y /cotizar/)
add_action('wp_enqueue_scripts', function () {
  if (!is_front_page() && !is_page('cotizar')) {
    wp_dequeue_script('google-recaptcha');
    wp_dequeue_script('wpcf7-recaptcha');
  }
}, 20);

// Años de experiencia automáticos: usar [vyr_anios] en el contador
add_shortcode('vyr_anios', fn() => (string) (date('Y') - 2014 - (date('md') < '1222' ? 1 : 0)));
```

```html
<!-- Preconnect de fuentes (head) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

```css
/* Foco visible y objetivos táctiles en campos del formulario */
.wpcf7-form :is(input,select,textarea,button):focus-visible{outline:3px solid #DB2C36;outline-offset:2px}
.wpcf7-form :is(input:not([type=checkbox]),select,.wpcf7-submit){min-height:44px}
```

Etiquetas del formulario (CF7, plantilla del formulario): cambiar cada campo a
`<label>Nombre [text* nombrecompleto autocomplete:name]</label>` y equivalentes para teléfono, servicio, ciudad y mensaje.

## Siguiente paso sugerido

Acceso a un navegador sin bloqueo (o capturas/PageSpeed del sitio) para medir LCP/CLS y revisar móvil; con eso se cierran las notas de Responsive y Rendimiento y se priorizan con datos.
