# Sitio real · rama `claude/mejoras-diseno-skills`

Las mejoras ya están aplicadas en el código real de la web: repositorio
[`JuanVilchezR/vyrseguritec-web`](https://github.com/JuanVilchezR/vyrseguritec-web), rama `claude/mejoras-diseno-skills`
(4 commits sobre `main`). **No se fusionó a `main` ni se desplegó.** No se reescribió ningún texto de cliente, ruta, campo de
formulario ni evento de analítica, salvo lo que se lista abajo.

Criterio: *refinamiento que conserva la marca* (rojo `#D32F2F` + grafito, Archivo/IBM Plex, lenguaje de plano de ingeniería),
con las skills Emil Kowalski (movimiento y detalle), Impeccable (calidad y detector), Taste (anti-plantilla) y UI/UX Pro Max
(accesibilidad y táctil). Cada cambio pasó por una auditoría de las 77 páginas compiladas y por dos revisiones independientes
(diseño y código).

## Qué cambió

| Área | Antes | Después |
| --- | --- | --- |
| Contraste (WCAG 1.4.3) | Texto blanco sobre verde WhatsApp claro y botones dentro de la prosa con color oscuro: fallaba en las 77 páginas | Verde `#15803D` y `.prose a:not(.btn)` |
| Foco no oculto (WCAG 2.4.11) | La cabecera y la barra inferior tapaban los controles al tabular en celular | `scroll-padding` superior e inferior (incluye el área segura) |
| Desborde horizontal | Las 17 fichas de bomba medían +220 px a 390 px | Columnas `minmax(0,1fr)` en la prosa |
| Tablas anchas | Se desplazaban sin acceso por teclado ni pista | Enfocables solo mientras desbordan, con nombre corto de región y la pista «Deslice la tabla…» |
| Portada, primera pantalla | Los seis accesos directos empezaban en y=912 (fuera de la pantalla en 1366×768 y 1440×900) | Bajo los botones, junto al formulario: caben enteros en 1366×768 y 1440×900 |
| Portada, «antes de su inspección» | Mostraba los tres primeros artículos de la lista | Muestra los de ITSE y los errores que detecta la inspección |
| Carrusel | Sin forma de detenerlo en pantallas táctiles | Botón de pausa y reanudar (WCAG 2.2.2) |
| Franjas de color de 3–4 px | En nota, descargas, índice, sello de servicio y formulario | Borde completo y fondo neutro; el rojo queda en el icono |
| Sobretítulos en mayúsculas | 31 en 10 plantillas (portada, plantilla común de las páginas interiores, blog, catálogo, contacto, landing y más) | Quitados; queda «Error 404», que es un dato |
| Índice lateral | El aside pegajoso medía hasta 778 px y cortaba los últimos ítems en pantallas bajas | La tarjeta de contacto queda fija y el índice se desplaza dentro |
| Catálogo, filtro | El resultado quedaba bajo el pliegue, lejos de los selectores | Estado visible junto a los selectores y «Limpiar filtros» |
| Catálogo, celular | 18 448 px, una bomba por pantalla | 16 225 px: sin las unidades SI ni «Listado UL / FM» en el listado (siguen en la ficha) e imagen más baja |
| Pie, celular | 2 034 px, enlaces de 22 px de alto (texto en línea) | 1 829 px: dos columnas y enlaces de 44 px |
| Teléfono de la landing | Sin nombre accesible en celular | `aria-label` «Llamar al …» |
| Foco en menús y respuestas | El anillo se recortaba dentro de `<details>` animados (Chromium 131+) | `overflow:clip` con margen |
| Caché | Cada página pedía su propia URL de `site.css`, `site.js` (78 sellos distintos) | Un sello por compilación; `mejoras.css` con caché de 7 días |
| Barra superior | Texto «Cotización en 24 horas» y enlace «WhatsApp directo» en todas las páginas | Quitados (el botón de la cabecera y la barra móvil registran el mismo evento `whatsapp`) |

Archivos: `public/assets/mejoras.css` (capa nueva, se carga después de `site.css`), `site.css` (reglas muertas y franjas
fuera), `site.js` (pausa del carrusel, tablas, estado del filtro), `src/lib/version.ts` (sello único), `src/layouts/Base.astro`,
`Pagina.astro`, `Cabecera.astro`, `CabeceraLanding.astro`, `index.astro`, `catalogo/bombas-contra-incendio.astro` y los
sobretítulos de seis páginas más.

## Resultados (77 páginas × 1440 px y 390 px)

| Medida | `main` | Rama |
| --- | --- | --- |
| Violaciones de axe (WCAG 2.2 AA), nodos | 485 en 154 vistas (contraste 444, regiones desplazables 40, nombre de enlace 1) | **0** |
| Controles totalmente tapados por la cabecera o la barra inferior al recibir el foco | 1 043 (las 77 páginas en celular) | **0** |
| Vistas con desborde horizontal | 17 (+220 px en celular) | **0** |
| Errores de consola o de red | 0 | 0 |
| Un solo `h1` y encabezados sin saltos | 77 de 77 | 77 de 77 |
| Accesos directos de la portada, 1366×768 y 1440×900 | y=912 (fuera) | y=578–764 y y=616–818 (caben) |
| Alto en celular: portada, catálogo, pie | 16 587, 18 448 y 2 034 px | 16 164, 16 225 y 1 829 px |
| Objetivos táctiles menores de 44 px en celular (sin enlaces dentro de texto) | 951 | 558 |
| URL distintas de `site.css` y `site.js` entre las 78 páginas | 78 | 1 |
| Suite de Playwright sobre la compilación real | sin referencia | 436 pasan y 0 fallan (805 pruebas; 369 se omiten según el ancho de pantalla) |
| Detector de Impeccable sobre los archivos cambiados | 9 hallazgos en el primer pase | 3 (2 avisos y 1 informativo, ver abajo) |

## Cómo verificarlo

```bash
cd vyrseguritec-web && npm run build                       # 78 páginas, verificar.mjs sin errores
# en este repositorio (Playwright contra la compilación real, sin red):
WEB_DIST=…/vyrseguritec-web/dist npx playwright test        # toda la suite
WEB_DIST=…/dist WEB_DIST_ANTES=…/dist-de-main node tests/support/barrido.mjs despues salida.json   # barrido A/B de las 77 páginas
```

`tests/segundo-lote.spec.ts` y `tests/todas-las-paginas.spec.ts` solo corren con `WEB_DIST`. Las pruebas nuevas fallan contra
la compilación de `main` (comprobado por mutación), así que miden lo que cambió.

## Decisiones que se dejaron al dueño del sitio

- **Menú principal:** «Proyectos» (solo renders) ocupa el lugar donde un comprador buscaría «Certificado ITSE».
- **Barra móvil:** «Cotizar» (rojo) compite con WhatsApp (verde) y el icono de WhatsApp se repite en la cabecera.
- **Formulario de la portada:** «Tipo de local» y «Servicio» llegan preseleccionados (Almacén, rociadores); si no se tocan, el
  mensaje de WhatsApp sale con datos que pueden no ser los del cliente.
- **Textos repetidos:** ocho rótulos distintos para la misma acción de WhatsApp y «24 horas» siete veces en la portada.
- **Prueba social:** sin logos ni fotos de obra reales; «Ing. sanitario colegiado» aparece sin nombre ni CIP.
- **Carrusel:** dibujos hechos a mano a falta de fotos reales de proyectos.

## Compromisos y excepciones conscientes

- Desde 901 px el orden visual (accesos directos a la izquierda, formulario a la derecha) difiere del orden de foco (formulario
  antes que los accesos). No se reordenó el HTML para no alterar el orden en celular.
- El detector de Impeccable deja 2 avisos (borde superior negro de 4 px en la placa de datos del catálogo y en las tarjetas de
  tipo de bomba) y 1 informativo (rejilla de plano en el héroe). Se mantienen por ser el motivo de la marca.
- El único texto menor de 12 px es el lema del logotipo (10 px en escritorio).
