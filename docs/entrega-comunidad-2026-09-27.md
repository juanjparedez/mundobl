# Conversaciones en Comunidad

Esta entrega reúne discusiones de series o capítulos, pedidos de reseñas y recomendaciones en un único PR.

## Funcionalidad

- `/comunidad`: acciones para iniciar los tres tipos de conversación, búsqueda, filtros por tipo y sin respuestas, reseñas recientes y paginación. Tarjetas con portada, autor público, fecha y extracto; los spoilers no se incluyen en los extractos.
- El formulario permite buscar una obra pública y, para discusiones, seleccionar un capítulo. Los capítulos activan automáticamente la protección de spoilers. Las recomendaciones pueden no tener obra asociada.
- Cada conversación tiene respuestas paginadas, revelado de spoilers y notificación al autor mediante sus preferencias existentes. El propietario puede cerrar, reabrir o borrar su conversación; cada usuario puede borrar sus respuestas y ADMIN/MODERATOR pueden moderar.
- Los pedidos de reseña enlazan al editor de la obra. La navegación conserva la distinción entre catálogo y aportes.
- Validación del servidor, cuentas autenticadas, visibilidad de las obras, identidad pública sin emails y límites por usuario de cinco conversaciones y treinta respuestas por hora. Los límites se serializan en PostgreSQL para evitar eludirlos mediante solicitudes simultáneas.
- Textos en los diez idiomas; componentes Ant Design y design-system, CSS separado y tokens del tema.

## Migración y entrega

`20260927175456_community_topics` agrega CommunityTopic, CommunityReply y su enum. Incluye índices, claves externas, restricciones y RLS habilitado en ambas tablas. Es aditiva y debe aplicarse mediante `migrate deploy` antes de desplegar el código nuevo. No usar migrate dev ni db push en producción.

El backup incluye las 67 tablas. Existe un respaldo previo de producción en un directorio local ignorado; no forma parte del PR. La restauración comprobada corresponde a datos de prueba locales, no al respaldo de producción.

La rama `codex/comunidad-conversaciones` deshabilita únicamente su preview automático de Vercel en `vercel.json`. Los controles de GitHub siguen activos y el merge a main conserva el despliegue de producción.

## Evidencia y límites

- `test-community-topics.ts`: helpers reales con PostgreSQL, tipos de conversación, pertenencia de capítulos, privacidad, visibilidad, permisos, cierre, paginación, límites concurrentes, cascadas y RLS.
- `test-community-flow.mjs`: navegador con componentes, handlers HTTP y base reales; creación de los tres tipos, spoilers, respuesta, permisos y moderación, enlaces y anchos 1280/390. La resolución de sesión y el envío de notificaciones se sustituyen por fixtures: no prueba Google OAuth ni entrega push/email real.
- Regresiones de privacidad, feed y estadísticas aprobadas. Backup/restauración local comprobó las 67 tablas, restricciones y secuencias. TypeScript, build de producción y comprobación de schema local aprobados.
- CI incorpora las pruebas nuevas. El merge requiere comprobar sus resultados y la migración compartida. La verificación del sitio público debe hacerse después del despliegue.

Fuera de esta entrega: chat privado, seguir conversaciones ajenas, menciones, reacciones sociales y recomendaciones automáticas por afinidad. No se inventa actividad para llenar el feed.
