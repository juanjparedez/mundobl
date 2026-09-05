# Gamificacion — proximo desarrollo

Estado: **integracion acotada con el Glosario Cultural implementada (2026-09-05); el resto sigue pendiente / no implementar en el alcance actual**.

Este documento separa la gamificacion de la implementacion del Glosario Cultural. La funcionalidad actual de logros del perfil puede seguir mostrando progreso derivado de estadisticas reales. Se habilito una ronda acotada que conecta el glosario/trivia con los logros existentes (ver "Implementado" abajo); el resto de la lista sigue sin ampliarse hasta que se decida puntualmente.

## Implementado (2026-09-05, alcance acotado)

- Contribuciones aprobadas al glosario cuentan para 2 logros nuevos ("Voz cultural" / "Colaborador cultural"), via `stats.approvedGlossaryTerms` en `/api/user/profile` — mismo patron `current >= goal` sin modelo `Achievement` en DB.
- ~~Integrar la trivia con puntos, logros o rachas globales, reemplazando el mejor puntaje local.~~ El mejor puntaje de la trivia ya **no** es 100% local: se agrego `User.glossaryQuizBestScore` + `GET`/`PATCH /api/user/glossary-quiz-score` (auth-gated, solo sube). `GlosarioQuiz.tsx` lo persiste por usuario cuando hay sesion y sigue cayendo a `localStorage` para anonimos (sin regresion). Alimenta el logro "Sabelotodo cultural" (puntaje perfecto).

Nota: esto sigue siendo la capa calculada de siempre (sin modelo `Achievement`, sin XP/niveles/notificaciones) — solo se agregaron 2 campos de stats server-side puntuales para que estos 3 logros dejen de depender exclusivamente de `localStorage`/conteos ya existentes.

## Pendientes funcionales

- Crear un modelo `Achievement` en Prisma para definir logros y metas desde backend.
- Crear un registro de desbloqueos por usuario con fecha de obtencion.
- Persistir los logros desbloqueados entre dispositivos y sesiones (mas alla de los 2 campos puntuales ya agregados).
- Emitir una notificacion cuando el usuario desbloquee un logro.
- Definir puntos o XP, niveles y reglas de acumulacion.
- Definir recompensas y su relacion con los logros.
- Crear un ranking o leaderboard, con criterios de privacidad y alcance.
- Crear insignias persistentes para perfil y comentarios.

## Decisiones necesarias para esa futura implementacion

- Si los logros seran globales para toda la aplicacion o separados por area.
- Si los puntos tendran valor solamente visual o habilitaran recompensas.
- Si el ranking sera opt-in y que datos publicos mostrara.
- Que acciones cuentan para progresar y como evitar abuso o spam.
- Si los logros actuales derivados de estadisticas se migran a datos persistidos o se mantienen como una capa calculada.

## Fuera del alcance (por ahora)

No agregar modelo `Achievement`, puntos/XP, niveles, rankings, notificaciones de logro ni recompensas. Cualquier implementacion de esta lista debe realizarse en una PR independiente, con su propia conversacion de alcance — el mismo criterio que se uso para acotar la ronda del 2026-09-05.
