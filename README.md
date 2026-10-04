# VYR SEGURITEC · mejoras de diseño de la web

Capa de mejoras de diseño para **www.vyrseguritec.com.pe**, con su batería de pruebas (Playwright).

> **Importante:** el código fuente de la web (proyecto Astro desplegado en Cloudflare Workers, `vyrseguritec-web`)
> **no está en este repositorio**. Aquí se entrega una capa que se aplica sobre lo ya publicado, probada contra una
> copia fiel del HTML/CSS/JS del 04/10/2026. No se reescribió ningún texto, ruta, campo de formulario ni evento de analítica.

## Qué se entrega

| Archivo | Qué es |
| --- | --- |
| `site/assets/mejoras.css` | **La mejora.** Se carga después de `site.css`. Reglas sin prefijo = todo el sitio; reglas `body.home` = solo la portada. |
| `site/index.html` | La portada publicada con **dos únicos cambios**: `class="has-bar home"` en el `<body>` y el `<link>` a `mejoras.css`. |
| `site/assets/site.css`, `site/assets/site.js` | Copias **idénticas** a las publicadas (una prueba lo verifica). No se modifican. |
| `docs/cambios.md` | Tabla antes/después con el porqué de cada cambio y la guía de integración. |
| `docs/auditoria.md` | Auditoría de la web publicada: hallazgos con prioridad, norma (WCAG) y recomendación. |
| `docs/capturas/` | Capturas antes/después (escritorio y celular, primera pantalla y página completa). Usan tipografías y fotos de prueba. |

## Cómo aplicarlo en tu proyecto Astro

1. Copia `site/assets/mejoras.css` a `public/assets/` (junto a `site.css`).
2. En el layout base (`Base.astro`), justo debajo del `<link>` de `site.css`, agrega
   `<link rel="stylesheet" href="/assets/mejoras.css?v=…">` (usa el mismo método de versión que `site.css`).
   *Alternativa sin tocar el layout:* pega el contenido de `mejoras.css` al final de `public/assets/site.css`.
3. En la **portada** agrega la clase `home` al `<body>` (hoy es `has-bar`; en las páginas internas es `page has-bar`).
   Sin esa clase solo se aplican las mejoras de todo el sitio (botones, foco, formularios, tarjetas, preguntas frecuentes).
4. Compila, revisa en la URL de vista previa de Cloudflare y publica.

**Para revertir:** quita el `<link>` (o el bloque pegado) y la clase `home`. Nada más cambió.

Limpieza opcional cuando ya esté validado: la capa **oculta con CSS** los 9 sobretítulos de la portada, la nota bajo los
botones del héroe y el bloque derecho de la barra superior. Cuando quieras, bórralos del HTML (`index.astro`) y elimina esas reglas.

## Cómo probarlo

```bash
npm install            # instala Playwright 1.56.1, axe-core y las tipografías de prueba
npm test               # 220 pruebas en 5 anchos (1440, 1366, 768, 390 y 320 px); 43 son solo de escritorio o solo de celular
CAPTURAS=1 npm run capturas   # regenera docs/capturas
node tests/support/capturar.mjs despues /tmp/caps escritorio,movil   # captura rápida para revisar el diseño
```

Las pruebas **no usan red**: `tests/support/site.mjs` intercepta el dominio de producción y sirve el HTML, CSS y JS desde
`tests/fixtures/baseline` (más las tipografías de `@fontsource` y recortes de las fotos publicadas como imágenes de prueba).

Qué verifican:

- **Entrega** (`entrega.spec.ts`): `site.css`/`site.js` intactos; `index.html` solo difiere en la clase y el enlace; sin `!important`.
- **Portada** (`home.spec.ts`): sin errores de consola; sin desborde horizontal; formulario → mensaje de WhatsApp correcto;
  validación; menús; preguntas frecuentes; carrusel; áreas táctiles ≥ 44 px; anillo de foco; contraste; movimiento reducido.
- **Accesibilidad** (`a11y.spec.ts`): axe-core WCAG 2.2 AA, 0 violaciones en la portada.
- **Páginas internas** (`paginas-internas.spec.ts`): 10 plantillas (servicio, solución, ciudad, blog, catálogo, contacto, libro de
  reclamaciones…) no empeoran frente a lo publicado.

## Skills instalados (`.claude/skills`)

`emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`,
`animation-vocabulary`, `break-ui` (Emil Kowalski) · `impeccable` · `design-taste-frontend`,
`redesign-existing-projects`, `full-output-enforcement` (Taste) · `playwright-cli`.
Versiones fijadas en `skills-lock.json`. Se dejaron fuera los de React Native, Swift, Sonner y los de generación de imágenes.

## Límites de esta entrega

- El dominio estaba bloqueado por la red del entorno: las capturas usan tipografías y fotos de prueba (la web real las carga de `/assets`).
- Solo se probó contra 10 páginas internas de muestra; las demás comparten las mismas plantillas.
- Lo que requiere cambiar HTML o JS (pausa del carrusel, fotos reales de obras) está listado en `docs/auditoria.md`.
