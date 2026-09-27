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

## Validación

`scripts/test-watching-ui.mjs` aprobado: búsqueda, marcado, capítulos divididos,
enlaces, fijados, preferencias, notas, comentarios públicos, diario e historial.
Incluye móvil de 390 px sin desbordamiento y tema claro. Las APIs están simuladas;
no valida OAuth ni reproducción en producción. Captura móvil inspeccionada.
ESLint del componente y formato Prettier aprobados.

Pendiente: comprobar el resultado desplegado con carátulas y biblioteca reales;
esta entrega no declara terminados los pendientes funcionales anteriores.
