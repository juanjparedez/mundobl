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
La corrección de posición requiere desplegar #93; no se declara verificada en
producción hasta entonces.
