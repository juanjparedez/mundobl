# Gamificacion — proximo desarrollo

Estado: **pendiente / no implementar en el alcance actual**.

Este documento separa la gamificacion de la implementacion del Glosario Cultural. La funcionalidad actual de logros del perfil puede seguir mostrando progreso derivado de estadisticas reales, pero no debe ampliarse como parte de las tareas del glosario.

## Pendientes funcionales

- Crear un modelo `Achievement` en Prisma para definir logros y metas desde backend.
- Crear un registro de desbloqueos por usuario con fecha de obtencion.
- Persistir los logros desbloqueados entre dispositivos y sesiones.
- Emitir una notificacion cuando el usuario desbloquee un logro.
- Definir puntos o XP, niveles y reglas de acumulacion.
- Definir recompensas y su relacion con los logros.
- Crear un ranking o leaderboard, con criterios de privacidad y alcance.
- Crear insignias persistentes para perfil y comentarios.
- Conectar la actividad del glosario y las contribuciones aprobadas con eventos de gamificacion, si se decide que corresponde.
- Integrar la trivia con puntos, logros o rachas globales, reemplazando el mejor puntaje local.

## Decisiones necesarias para esa futura implementacion

- Si los logros seran globales para toda la aplicacion o separados por area.
- Si los puntos tendran valor solamente visual o habilitaran recompensas.
- Si el ranking sera opt-in y que datos publicos mostrara.
- Que acciones cuentan para progresar y como evitar abuso o spam.
- Si los logros actuales derivados de estadisticas se migran a datos persistidos o se mantienen como una capa calculada.

## Fuera del alcance del Glosario Cultural

No agregar modelos, puntos, niveles, rankings, notificaciones ni recompensas de gamificacion mientras se cierre el flujo actual del glosario. Cualquier implementacion de esta lista debe realizarse en una PR independiente.
