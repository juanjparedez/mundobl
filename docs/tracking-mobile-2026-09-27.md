# Seguimiento: ajuste móvil del 27/09/2026

El tracking no se considera cerrado como experiencia de producto. La biblioteca,
el historial, el diario privado y las acciones por capítulo ya existen; quedan
pendientes múltiples visionados, conflictos de importación y una experiencia de
recomendaciones/conversaciones más completa.

## Cambio acotado

- Carátulas con proporción 2:3, sin recorte y sin estirarse al alto del contenido.
- En móvil, portada y título comparten la cabecera; progreso y acciones usan todo
  el ancho. Tanto Lista como Tarjetas conservan sus controles.
- Botones de al menos 44 px y filtros en dos columnas cuando caben.
- Estadísticas compactas en móvil, omitiendo la explicación repetida de alcance.
- Sin cambios en APIs, persistencia, privacidad ni migraciones.

## Historial y regreso

- Historial agrupado por destino de la obra (no por título): los eventos de
  páginas posteriores se incorporan a su grupo y conservan la cronología.
- Pestaña, búsqueda, estado de biblioteca y búsqueda de historial se conservan
  en la URL mediante replaceState, sin crear entradas por cada pulsación.
- Volver usa la navegación interna registrada, en vez de asumir que el origen
  siempre fue el catálogo. Entrada directa: destino seguro de la sección.
- Acceso a Volver en la barra general, incluido perfil móvil. Las fichas que
  ya tienen su botón conservan una sola acción; /ver usa el mismo criterio.
- Texto de regreso traducido en diez idiomas. No equivale a una auditoría de
  todos los formularios administrativos ni de navegadores externos.

## Validación

`scripts/test-watching-ui.mjs` aprobado: búsqueda, marcado, capítulos divididos,
enlaces, fijados, preferencias, notas, comentarios públicos, diario e historial.
Incluye móvil de 390 px sin desbordamiento y tema claro. Las APIs están simuladas;
no valida OAuth ni reproducción en producción. Captura móvil inspeccionada.
ESLint del componente y formato Prettier aprobados.

Prueba ampliada aprobada: obras homónimas en grupos diferentes, carga de más
eventos dentro de la misma obra, búsqueda y pestaña después de recargar y
seguimiento → perfil → Volver con Historial seleccionado. Perfil usa respuesta
simulada de indisponibilidad para comprobar el regreso sin depender de widgets.
TypeScript completo sin errores; revisión de hooks y textos traducidos realizada.

Producción de #92 comprobada con carátulas y biblioteca reales a 390 px: sin
desbordamiento, portada completa y regreso desde ficha a la pestaña Historial.
Esta entrega no declara terminados los pendientes funcionales anteriores.

## Regreso después de cargar más historial

Corrección posterior al merge de #92: se conserva en la URL la cantidad de
páginas abiertas y se recuperan al volver o recargar, mediante consultas
autenticadas nuevas. No se guardan eventos privados en almacenamiento local.
Cambiar la búsqueda o borrar el historial reinicia esa profundidad.

La recuperación automática está limitada a 20 páginas para evitar una ráfaga
ilimitada de solicitudes desde una URL manipulada; Cargar más sigue disponible.
Los eventos repetidos entre páginas se deduplican. La prueba UI verifica dos
páginas, agrupación conservada y borrado posterior; no prueba un historial real
de miles de eventos.

## Posición al volver

La verificación real detectó que, al volver desde una ficha abierta a unos
1.679 px de profundidad, el historial regresaba al inicio. Se guarda la posición
en la entrada del navegador y se restaura después de cargar los datos de
Biblioteca o Historial. Se identifica por cuenta y URL; no almacena eventos ni
notas privadas. Los cambios de búsqueda o pestaña no reutilizan otra posición.

Prueba móvil de 390 px: recarga y seguimiento → Perfil → Volver recuperan la
posición (tolerancia 2 px), las dos páginas y los tres eventos de prueba.
Diario privado y formularios administrativos quedan fuera de esta restauración.
La corrección se desplegó con #93 y se verificó en producción, como se registra
en la siguiente sección.

## Pulido del panel de episodios

Tras el merge de #93 se verificó en producción el regreso a la misma posición
del historial (1.678,67 px, 14 eventos y 3 grupos), con tres checks aprobados.

Siguiente entrega: controles de fecha, conversación pública y nota privada con
área táctil mínima de 44 px en móvil; acciones en una fila propia que permite
envolver textos; títulos completos y menos padding anidado dentro del panel.
El cierre del panel también tiene un área de 44 px. Los snapshots del historial
ya no reservan un encabezado vacío para una fecha de registro que no se muestra.

Validado a 390 px con APIs simuladas: límites y tamaños de las acciones,
corrección de fecha, nota privada y publicación explícita de comentario. La
prueba espera a que el panel termine de adaptarse al viewport antes de medir.
TypeScript y ESLint aprobados. No cambia persistencia, permisos ni traducciones.

El acceso directo desde un evento del historial al episodio identificado de
forma estable se incorporó después, en #95 (ver siguiente sección).

## Notas y conversaciones desde el historial

La siguiente entrega conecta eventos de episodio con su nota privada y su
conversación pública, en acciones separadas. El servidor resuelve el capítulo
con `groupIntoChapters`, igual que el panel de episodios: una segunda parte abre
la nota/conversación de la primera parte del capítulo, sin inferir IDs a partir
de números. Consulta las temporadas necesarias en un único lote. Eventos de
serie/temporada y extras sin capítulo resuelto conservan el enlace a la ficha.

No se publica al abrir una conversación y la nota privada no se copia al
formulario público. Se reutilizan los editores y textos traducidos existentes.
No incorpora reproducción ni marcado desde el evento histórico.

Verificación: PostgreSQL local nativo (partes, aislamiento, historial y borrado),
TypeScript, ESLint y prueba UI con APIs simuladas. La UI recupera la nota ya
guardada y la conversación existente, sin publicar ni mostrar la nota en ella.

## Estado verificado después del merge de #95

El 27/09/2026 se integró #95 en `main`, commit
`e1aa722faa7b95a9c206ab64cfa49b126383484d`, con tres checks aprobados.
Después de actualizarse producción se verificó el historial autenticado:

- Los eventos de capítulos ofrecen Nota privada y Conversación pública;
  los eventos de serie conservan su presentación sin esas acciones.
- Ambas acciones del evento Seeing double T1 · E4 abren un modal identificado
  con esa misma obra y capítulo. Se cerraron sin guardar ni publicar.
- A 390 px, ambos botones miden 44 px de alto y quedan dentro del viewport.
  El modal público mide 374 px de ancho y su formulario se abre vacío.
- #94 también está comprobada en producción: fecha, nota y conversación del
  panel de episodios tienen controles de 44 px dentro de la pantalla móvil.

Las evidencias locales están en `test-results/tracking-historial-produccion-95.png`
y `test-results/tracking-verificacion-pr94.md` (ignoradas por Git). La prueba real
es de lectura; la escritura, el aislamiento y las partes se verificaron con las
pruebas locales indicadas arriba. No equivale a probar todos los dispositivos.

## Qué queda abierto en esta pasada

La entrega de episodios, historial agrupado y uso móvil ya está integrada. No
queda un despliegue pendiente de #92–#95. Antes de dar por cerrada la experiencia
completa falta comprobar el diario privado y los estados vacíos/error en móvil,
y recorrer el regreso desde los destinos de seguimiento que aún no tienen
evidencia real. Registrar problemas concretos encontrados antes de ampliar funciones.

Múltiples visionados, edición de importaciones con conflictos y funciones
sociales más amplias siguen como pendientes de producto; no son requisitos
añadidos automáticamente a esta pasada de pulido.

## Diario: corrección local posterior a #95

La revisión encontró que un fallo de carga terminaba mostrando el estado vacío
tras un aviso transitorio. Ahora muestra un error persistente con Reintentar;
la exportación queda deshabilitada mientras carga o falla para evitar descargar
resultados anteriores como si fueran los del filtro actual. Se reutilizan textos
existentes en los diez idiomas.

En móvil, búsqueda, limpieza, filtros y exportación tienen controles de al menos
44 px; los títulos pueden ocupar varias líneas. La prueba UI simula un 503,
comprueba que no aparece un diario vacío ni resultados anteriores, reintenta y
recupera la nota. Mide controles a 390 px y ejecuta el resto de regresiones de
tracking. Prueba UI, TypeScript y ESLint aprobados. Captura inspeccionada:
`test-results/watching/diary-mobile.png`. Cambios locales, aún sin desplegar.
