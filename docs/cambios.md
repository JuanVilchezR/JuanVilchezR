# Cambios de diseño · portada y sitio

Criterio de partida (skill *Taste*, "Redesign · Preserve"): **evolución dirigida, sin romper la marca.**
Lectura del diseño: rediseño que conserva la identidad de una web B2B de protección contra incendio para compradores técnicos
en Perú, con el lenguaje de plano de ingeniería que ya tenía (cajetín, rejilla, etiquetas NFPA) y un único llamado a la acción
(WhatsApp). Diales: variación 4 · movimiento 3 · densidad 5.

**Se conservó:** logotipo, colores (rojo `#D32F2F` + grafito), tipografías (Archivo VYR, IBM Plex Sans/Mono), todos los textos,
rutas, orden y nombres de los campos del formulario, y los atributos `data-evento` de analítica.

## Antes / después

| Antes | Después | Por qué |
| --- | --- | --- |
| Texto blanco sobre verde `#1FA855` (3,1:1) en todos los botones de WhatsApp | Verde `#15803D` (5,0:1) | Pasa WCAG 1.4.3 (AA). axe-core: 1 fallo "serious" (más 48 nodos no concluyentes) → 0 |
| Bordes de campos `#BDBDBD` (1,9:1) | `#8C8C8C` (3,4:1) + foco con borde rojo y halo, error con `:user-invalid` | WCAG 1.4.11; el usuario ve dónde escribe y qué falta |
| `.btn` sin estado "presionado" | `transform: scale(.97)` en `:active`, 160 ms, curva `cubic-bezier(.23,1,.32,1)` | El botón confirma que oyó el toque (Emil Kowalski) |
| En celular: menú 87×38, WhatsApp de cabecera 42×42, flechas 36×36, puntos 32×24 y preguntas clicables solo en su línea de 24 px | Mínimo 44 px (barra inferior 48 px; toda la fila de la pregunta es clicable) | Área táctil cómoda (WCAG 2.5.5); toques fallidos con guantes o en obra |
| Cabecera y barra inferior de 370 px dentro de 320 px (desborde de 50 px) | Caben: logo y botón de menú compactos bajo 380 px | Celulares chicos (iPhone SE, Android de entrada) |
| 9 sobretítulos en mayúsculas (héroe + 8 secciones) sobre los títulos | Quitados en la portada (se ocultan con CSS) | El título ya dice de qué trata; era la plantilla repetida de cada sección |
| 5 llamados a WhatsApp en la primera pantalla (barra superior, cabecera, héroe, botón de envío del formulario y botón flotante) | 3 (cabecera, héroe y envío del formulario). El flotante aparece al pasar el héroe | Un solo camino principal; menos ruido |
| Nota bajo los botones del héroe repetía "24 horas" y "planos o fotos" | Oculta: ya lo dicen el formulario y la franja de cifras | "24 horas" aparecía 7 veces en la página |
| Ficha de cotización con borde rojo de 4 px sobre esquina redondeada | Franja roja recortada por las esquinas (como una tapa) | El borde grueso chocaba con el radio |
| Texto del héroe alineado arriba, con hueco bajo los botones | Centrado respecto a la ficha; rejilla de fondo con degradado de salida | Composición equilibrada; la rejilla deja de ser un papel tapiz |
| Tarjeta de servicio: solo el título era enlace | Toda la tarjeta es el enlace; los 4 sub-enlaces siguen activos | Objetivo de clic mucho mayor (Fitts); sin cambiar destinos |
| Celdas de "soluciones": dos enlaces iguales por celda ×9 | Celda completa enlaza; flecha dibujada aparece al pasar; "Consultar mi caso" pasa a secundario | Jerarquía clara: primero la norma, luego WhatsApp |
| Preguntas frecuentes en columna angosta a la izquierda; signo `+`/`–` que cambia de golpe | Título fijo a la izquierda y respuestas a la derecha; el `+` gira a `×`; la respuesta se despliega (donde el navegador lo permite) | Aprovecha el ancho; el cambio de estado se ve |
| Casi sin movimiento (solo color en hover) | Entrada del héroe (ficha y accesos, 450–500 ms, sin animar título ni texto para no frenar el LCP), elevación y zoom de foto solo con puntero fino, sombra de cabecera al desplazarse, transición suave entre páginas | Un momento autoral + retroalimentación; nada con `prefers-reduced-motion` |
| Flechas de las ciudades como glifo de texto `→` | Flecha SVG con el mismo trazo en todo el sitio | Iconografía consistente (regla de Impeccable) |
| Contenido por debajo del pliegue visible solo con el desplazamiento "clásico" | *(Probado y descartado)* Revelado al desplazarse: las tarjetas partían de 35 % de opacidad y los auditores (axe, Lighthouse) las medían así | Se eliminó: contradecía "un solo momento de movimiento" y dañaba la medición de contraste |

## Cómo se integra

Ver `README.md`. En resumen: copiar `mejoras.css`, enlazarlo después de `site.css` y agregar `home` al `<body>` de la portada.
Para revertir basta quitar el enlace y la clase.

## Lo que esta capa NO resuelve (necesita HTML, JS o contenido)

1. **Fotos reales de obras y logotipos de clientes** en "Proyectos": hoy son dibujos técnicos y fotos referenciales. Es el mayor
   refuerzo de confianza posible y solo puedes aportarlo tú (con permiso del cliente).
2. **Carrusel automático sin botón de pausa** (WCAG 2.2.2): hoy se detiene al pasar el mouse o enfocar, pero conviene un botón de pausa.
3. **Quitar del HTML** los sobretítulos ocultos, la nota del héroe y el bloque derecho de la barra superior (hoy se ocultan con CSS).
4. **Formulario del héroe**: 7 campos. Si quieres más contactos, probar uno de dos pasos (nombre + teléfono primero) requiere HTML y JS.
5. **Repetición de "24 horas"** (7 veces) y de "Consultar mi caso" (9 veces): es copy; conviene decidirlo con calma.
