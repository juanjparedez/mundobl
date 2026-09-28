# Comunidad: pertenencia y control

Entrega acordada después del PR #103. Un único PR final, con migraciones, controles y despliegue coordinados; no publicar avances incompletos.

## Contrato de producto y privacidad

1. Listas ordenadas con título, descripción, obras y motivos opcionales. Privadas al crear; previsualización y publicación deliberada, edición, retirada y borrado. Top 5 reutiliza listas, admite entre una y cinco obras y solo se destaca cuando el usuario lo elige.
2. Perfil público separado del perfil personal. Opt-in, presentación y avatar opcional; sin email, historial, notas, estadísticas personales, suscripciones ni bloqueos. Las listas públicas pueden compartirse sin obligar a publicar un perfil.
3. Invitación discreta al Top 5 para usuarios autenticados, nunca modal obligatorio. Crear, posponer o descartar de forma persistente entre dispositivos; sin publicar ni enviar avisos por completar la invitación. Siempre accesible manualmente.
4. Conversaciones desde obra/capítulo, enlaces propios, mis publicaciones y conversaciones seguidas. Nuevos temas se guardan privados por defecto; publicación explícita. Las conversaciones previamente publicadas mantienen su estado. Las respuestas requieren una acción explícita de publicación en una conversación pública.
5. Seguimiento opt-in y aviso de respuestas opt-in, por conversación. Silenciar y dejar de seguir; ver actividad nueva. Recomendaciones con obras adjuntas y acción de agregar a pendientes que no sobrescriba seguimiento existente.
6. Bloqueo recíproco en las superficies nuevas de Comunidad y supresión de interacciones/notificaciones entre cuentas bloqueadas. Explicar que contenido público puede verse sin sesión: bloquear no convierte una publicación en privada. Silenciar conversaciones no afecta a otros.
7. Denuncias con motivos y revisión ADMIN/MODERATOR: ocultar/restaurar publicaciones, resolver o desestimar con motivo y registro de acciones. Las denuncias no revelan al denunciante al denunciado. Moderar contenido público no concede lectura de borradores privados. Configuración de disponibilidad de funcionalidades desde administración.
8. Métricas agregadas de participación pública y pedidos sin respuestas; no contabilizar borradores como actividad pública. Protección de acceso, límites de escritura concurrente y validación en servidor.

## Calidad y aceptación

- UI progresiva: crear, descubrir y administrar separados; estados vacíos útiles, errores recuperables, confirmaciones de publicación/borrado, accesibilidad y móvil. Componentes compartidos, Ant Design/design-system, CSS con tokens, diez idiomas.
- Pruebas con PostgreSQL real: dueño/tercero/invitado/moderador, borradores y retirada inmediata, obras ocultas, bloqueos recíprocos, preferencias, concurrencia, límites, denuncia y registro. Metadatos/API/feed deben cumplir la misma privacidad.
- Navegador: crear lista → ordenar → previsualizar → publicar → compartir → retirar; Top 5 y descarte persistente; ficha → conversación → seguir → respuesta → silenciar; denuncia → administración. Probar móvil y escritorio con el layout real además de componentes aislados.
- Exportación personal incluye datos propios nuevos sin datos privados ajenos; borrado de cuenta y backup/restauración cubren nuevos modelos. Importar no publica contenido ni reactiva permisos/avisos.
- Migraciones aditivas con RLS; local primero, backup antes de producción, migrate deploy antes del código que requiere tablas nuevas. CI/build y verificación pública posterior.

Fuera de alcance: mensajes privados/chat, recomendaciones algorítmicas, gamificación/rachas y exposición automática del seguimiento. Este plan conserva el alcance hasta verificarlo completo; tener schema o endpoints no equivale a una entrega terminada.

## Estado

- Plan y contrato definidos; implementación en curso. No hay despliegue nuevo.
- Migración local generada/aplicada: `20260928005043_community_belonging`; ocho modelos nuevos y RLS. Conserva publicaciones existentes. Backup/restauración local comprobado para 75 tablas, con datos y relaciones en los ocho modelos nuevos, restricciones y secuencias.
- Helpers y APIs de listas/perfiles/bloqueos/denuncias/moderación implementados. Ediciones de listas con revisión para evitar pisar cambios simultáneos; publicación separada y retirada inmediata. Exportación propia y limpieza de borradores al borrar cuenta.
- `test-community-library.ts`, `test-community-request.ts`, `test-community-moderation.ts` cubren reglas y límites en entorno local. Las regresiones previas de topics y recorrido HTTP/navegador pasaron durante la implementación; repetir tras completar integración.
- Implementados y probados localmente: UI de listas/perfil/Top 5 e invitación; borradores editables con publicación separada; conversaciones propias/seguidas con actividad nueva; seguir/silenciar/avisos opt-in; recomendaciones adjuntas y guardado sin reemplazar progreso. Filtros por obra/capítulo y enlaces de entrada desde fichas y reproducción. Traducciones en diez idiomas. Navegador con componentes y APIs reales más PostgreSQL; sesión/navegación simuladas, sin verificación de OAuth ni entrega externa de notificaciones.
- Implementados: controles de denuncia/bloqueo, panel de moderación con motivos e historial, configuración ADMIN, métricas públicas que excluyen borradores y obras ocultas. Se eliminaron los accesos heredados de moderadores para borrar contenido ajeno sin auditoría. Pausas muestran errores traducidos y la invitación se comprueba al navegar.
- Importación probada: listas, conversaciones y presentación se recuperan privadas, con identificadores nuevos; no restaura publicaciones, permisos, avisos, respuestas, seguimientos, bloqueos ni denuncias. Exportación conserva los datos propios correspondientes. Reimportación y concurrencia no duplican contenidos.
- Build de producción, TypeScript, pruebas de origen/solicitudes y regresión de listas/perfiles/Top 5 aprobados. Recorrido completo con layout real aprobado: listas privadas/publicación/retirada, recomendaciones, denuncia/moderación y borrador vinculado al capítulo; anchos 1280/390 sin desbordamientos ni errores de página. CI incorpora las pruebas nuevas y el servidor Next real.
- PR #104 publicado. Migraciones y restauración aprobadas en GitHub; integración pendiente tras corregir una espera de red en el test de navegador. Respaldo/migración de producción pendientes de autorización explícita para la copia local de datos sensibles; no se ejecutaron. Comprobación pública pendiente del merge. La rama tiene preview de Vercel deshabilitado; el merge a main conserva el despliegue automático.
