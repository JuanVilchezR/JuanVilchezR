# Auditoría de la portada · www.vyrseguritec.com.pe (publicada el 04/10/2026)

**Alcance:** portada y componentes compartidos del sitio. **Método:** capturas de escritorio y celular, lectura del HTML/CSS/JS
publicados, axe-core (WCAG 2.2 AA) y mediciones con Playwright en 1440, 1366, 768, 390 y 320 px (`tests/support/medir.mjs`).
**Revisión:** además, un segundo agente independiente revisó las capturas y el CSS (320–1920 px) y sus hallazgos se aplicaron (ver `docs/cambios.md`).
**Límites:** el dominio estaba bloqueado por la red del entorno (se trabajó con una copia fiel del HTML/CSS/JS; tipografías y
fotos de prueba); no se midió con Lighthouse ni con lector de pantalla real; las páginas internas se probaron en una muestra de 10.

## Puntaje de salud (estimado, 0–4 por dimensión)

| # | Dimensión | Publicada | Con mejoras | Hallazgo principal |
| --- | --- | :-: | :-: | --- |
| 1 | Accesibilidad | 2 | 3 | Contraste del texto blanco sobre el verde de WhatsApp: 3,09:1 (axe: 1 fallo *serious*). Ahora 5,02:1 y 0 violaciones. Pausa del carrusel resuelta con `mejoras.js` (opcional); falta probar con lector de pantalla real |
| 2 | Rendimiento | 3 | 3 | Héroe sin imagen (el LCP es texto), fuentes con *preload*, imágenes con ancho y alto. La capa suma 6,3 KB de CSS y 1,3 KB de JS opcional (gzip) |
| 3 | Tema / tokens | 3 | 3 | Tokens en `:root`, pero redefinidos en 3 capas sucesivas del CSS |
| 4 | Responsive | 3 | 4 | A 320 px la cabecera y la barra inferior medían 370 px (50 px de desborde). Corregido |
| 5 | Integridad de la implementación | 3 | 3 | Sistema coherente de "plano de ingeniería"; plantilla repetida en cada sección (9 sobretítulos, cifras en grande, 5 llamados a WhatsApp) |
| | **Total** | **14/20** | **16/20** | *Bueno*; con mejoras, *bueno* alto. Estimación propia, no un puntaje de Lighthouse |

## Hallazgos

Cada hallazgo: observación · norma y numeral · riesgo · recomendación · prioridad · estado.

### P1 (grave)

**1. Contraste insuficiente en los botones de WhatsApp**
- *Observación:* texto blanco de 16 px/600 sobre `#1FA855` = **3,09:1** en todos los botones verdes (cabecera, héroe, formulario, barra móvil, menú, cierre). axe-core lo confirma en el botón de la cabecera y marca como no concluyentes 48 nodos más con el mismo par de colores.
- *Norma:* WCAG 2.2 · 1.4.3 Contraste (mínimo), nivel AA: 4,5:1 (el texto de 16 px/600 no cuenta como "grande").
- *Riesgo:* el botón principal del negocio se lee mal con sol o en pantallas baratas; los auditores (axe, Lighthouse) lo marcan.
- *Recomendación:* verde `#15803D` (5,02:1); hover `#116B32` (6,6:1). — **Resuelto** en `mejoras.css` (`--wa`, `--wa-dk`).

**2. Desborde horizontal en celulares chicos y en anchos intermedios**
- *Observación:* a 320 px de ancho el documento mide 370 px: el logo, el botón de WhatsApp y el botón "Menú" no caben; la barra inferior también. En páginas con la franja `.cta-linea`, su botón (`white-space:nowrap`) añade otros 9 px. Entre 521 y 561 px (celulares grandes de lado, plegables abiertos) el botón de menú se sale de la pantalla (46 px a 521 px, 6 px a 561 px) porque el sitio oculta el texto del botón de WhatsApp solo hasta 520 px; lo halló la revisión independiente. A 280 px (Galaxy Fold original plegado) la cabecera y la barra inferior se pasan 11 px.
- *Norma:* WCAG 2.2 · 1.4.10 Reflujo (AA): sin desplazamiento horizontal a 320 px.
- *Riesgo:* la página se desplaza de lado en celulares chicos; el botón de menú, que es el único acceso a la navegación, queda parcialmente fuera de pantalla.
- *Recomendación:* compactar logo y botón de menú bajo 380 px y bajo 300 px; ocultar el texto del botón de WhatsApp hasta 575 px; permitir que el botón de la franja parta su texto. — **Resuelto** (desborde 50 px → 0 a 320 px, 46 px → 0 a 521 px y 11 px → 0 a 280 px; una prueba recorre 26 anchos de 280 a 1200 px en la portada y 3 páginas internas).

**3. Falta de prueba social verificable** *(contenido, no diseño)*
- *Observación:* "Proyectos" muestra dibujos técnicos y las fotos de servicios son "referenciales"; no hay obras reales, logotipos de clientes ni testimonios.
- *Riesgo:* para un comprador B2B que decide un sistema de seguridad de vida, es la principal razón para dudar.
- *Recomendación:* fotos reales de obras (con permiso del cliente), logotipos, 2 o 3 casos con m² protegidos y ciudad, constancias/listados UL-FM enlazados. No se inventó ninguno. — **Pendiente (lo aportas tú).**

### P2 (menor)

**4. Bordes de campos sin contraste suficiente**
- *Observación:* `#BDBDBD` sobre blanco = 1,9:1. · *Norma:* WCAG 2.2 · 1.4.11 Contraste de elementos no textuales (AA, 3:1). · *Riesgo:* no se distingue dónde escribir. · *Recomendación:* `#8C8C8C` (3,4:1) + foco rojo con halo + estado de error `:user-invalid`. — **Resuelto.**

**5. Áreas táctiles pequeñas en celular**
- *Observación:* botón de menú 87×38, WhatsApp de la cabecera 42×42, flechas del carrusel 36×36, puntos 32×24, y cada pregunta frecuente solo era clicable en su línea de texto (24 px de alto).
- *Norma:* WCAG 2.2 · 2.5.8 Tamaño del objetivo (mínimo, AA: 24 px) se cumplía; 2.5.5 (AAA) y las guías de Apple/Google piden 44 px. · *Riesgo:* toques fallidos, sobre todo con guantes o en obra. · *Recomendación:* mínimo 44 px (barra inferior 48). — **Resuelto** (0 objetivos menores a 44 px).

**6. Carrusel con avance automático sin botón de pausa**
- *Observación:* avanza cada 5 s; se detiene con el mouse, con el foco y con movimiento reducido, pero no hay botón de pausa.
- *Norma:* WCAG 2.2 · 2.2.2 Pausar, detener, ocultar (nivel A). · *Riesgo:* en pantallas táctiles no hay forma de detenerlo. · *Recomendación:* botón de pausa y reanudar al inicio de la fila de puntos. — **Resuelto** con `mejoras.js` (opcional, 2,6 KB, sin tocar `site.js`): pausado no se reanuda al sacar el puntero ni el foco; con movimiento reducido no aparece (allí el carrusel no avanza solo). Probado con el reloj de Playwright (ratón, teclado, sin foco, flechas con pausa activa, 320 a 520 px) y rompiendo a propósito cada mecanismo para confirmar que las pruebas fallan. *Pendiente:* probarlo con un lector de pantalla real; la solución definitiva es llevar el botón al HTML del carrusel y a `site.js`.

**7. Jerarquía de la primera pantalla**
- *Observación:* 5 llamados a WhatsApp visibles (barra superior, cabecera, héroe, formulario, botón flotante); formulario de 690 px que empujaba los accesos y las cifras fuera de la pantalla; texto del héroe pegado arriba con un hueco debajo; en una laptop de 1366×768 (≈650 px útiles con la barra del navegador) el botón de enviar quedaba cortado y el de WhatsApp del héroe, bajo el pliegue.
- *Recomendación:* un camino principal (3 llamados, el flotante aparece al pasar el héroe), formulario de 656 px, texto centrado respecto a la ficha, y ajuste para pantallas de poca altura. — **Resuelto.**

**8. Objetivo de clic pequeño en tarjetas y celdas**
- *Observación:* en las 4 tarjetas de servicio y las 9 celdas de soluciones solo el título era enlace.
- *Recomendación:* enlace extendido (la tarjeta/celda completa navega; los sub-enlaces y "Consultar mi caso" siguen siendo independientes). — **Resuelto** y probado (clic en la foto y en el texto).

### P3 (detalle)

**9. Plantilla repetida:** 9 sobretítulos en mayúsculas con tracking sobre los títulos (héroe + 8 secciones), franja de cifras "número grande + etiqueta", "24 horas" 7 veces y "Consultar mi caso" 9 veces. — Sobretítulos y nota del héroe: **resueltos con CSS** (siguen ocultos en el HTML; borrarlos al portar). Cifras y textos repetidos: **decisión de copy, pendiente**.

**10. Sin estados de respuesta en botones y tarjetas** (sin norma): ni estado "presionado" ni elevación. — **Resuelto** (`scale(.97)` en `:active`; elevación solo con puntero fino).

**11. FAQ en columna angosta** con mucho espacio vacío a la derecha. — **Resuelto** (título fijo a la izquierda, respuestas a la derecha; bajo 900 px una columna).

**12. Movimiento casi nulo y rígido:** solo cambios de color; con movimiento reducido todas las transiciones se anulaban (incluso el color). — **Resuelto**: una entrada del héroe, transición entre páginas, sombra de cabecera, botón flotante; nada de eso se aplica con `prefers-reduced-motion` (se mantiene la regla original).

**13. Capas acumuladas en `site.css`** (v1 → Home v2 → Paleta → Auditoría → Catálogo): `--navy`, `--ink` y `--red` se redefinen 3 veces; hay colores fijos (`#8FE0A8`, `#FF5A4F`, `#15803D`). — **Pendiente** (consolidar cuando haya acceso al repositorio Astro).

**14. Listas desplegables en celular:** la opción elegida se corta a media palabra (por ejemplo, "…certificado de op"). *Norma:* sin numeral aplicable (usabilidad). *Recomendación:* acortar los textos de las opciones (contenido); `text-overflow` no actúa en `select`. — **Pendiente.**

**15. Patrón de borde de color grueso a un lado** (`.callout`, `.descarga`: `border-left:4px`) en páginas internas. — **No se tocó** (fuera de la portada); candidato para una pasada posterior de páginas internas.

## Lo que está bien y se conservó

Semántica sólida (landmarks, `h1`–`h3`, `lang="es-PE"`), enlace "Ir al contenido", menús con `aria-expanded`, carrusel con
`aria-roledescription`, formularios con `label for`, `autocomplete` e `inputmode` correctos, datos estructurados completos
(LocalBusiness, FAQPage, BreadcrumbList), canonical y Open Graph, fuentes propias con `preload` y `font-display:swap`, héroe sin
imagen (LCP de texto), imágenes con ancho y alto, mensaje de WhatsApp armado con los datos del formulario, Libro de Reclamaciones.
**Se respetaron:** rutas, anclas, nombres de menú, orden y nombres de los campos del formulario y atributos `data-evento`
(lo exige la regla de *Taste* "qué nunca cambia en silencio", y una prueba lo verifica).

## Cifras (antes → después), reproducibles con `node tests/support/medir.mjs`

| Medida | Escritorio 1440×900 | Celular 390×844 | Celular 320×640 |
| --- | :-: | :-: | :-: |
| Contraste texto del botón de WhatsApp | 3,09 → **5,02** | 3,09 → **5,02** | 3,09 → **5,02** |
| Contraste del borde de los campos | 1,88 → **3,36** | 1,88 → **3,36** | 1,88 → **3,36** |
| Desborde horizontal | 0 → 0 | 0 → 0 | 50 px → **0** |
| Objetivos táctiles < 44 px (medidos) | 14 → **0** | 9 → **0** | 9 → **4** (los 4 puntos del carrusel miden 27×44: se encogen para caber junto al botón de pausa y las flechas) |
| Sobretítulos visibles | 9 → **0** | 9 → **0** | 9 → **0** |
| Alto del formulario | 690 → **656** px | 900 → **853** px | 915 → **867** px |
| Alto del héroe | 970 → **949** px | 2006 → **1767** px | 2168 → **1877** px |
| Alto de la página | 8754 → 9191 px | 16 569 → 16 760 px | 17 723 → 17 854 px |
| Violaciones axe-core (WCAG 2.2 AA) | 1 → **0** | 1 → **0** | 2 → **0** |
| Peso añadido | CSS 20,9 KB · 6,3 KB gzip · 5,6 KB brotli; JS opcional 2,6 KB · 1,3 KB gzip · 1,0 KB brotli | | |

La página crece 437 px en escritorio (más aire entre secciones) y 191 px en celular (1 %, por los sub-enlaces de 44 px); el héroe se acorta 21 px en escritorio y 239 px en celular.
