# Auditoría de estadísticas públicas — 2026-10-31

Rama local: `codex/fix-estadisticas-integrales`. El propietario autorizó merge y deploy al finalizar. Sin cambios de datos remotos ni migraciones.

## Causas y correcciones

| Reporte | Problema | Criterio corregido |
| --- | --- | --- |
| Favoritos | La ficha contaba todas las cuentas y el ranking excluía ADMIN | Ambos excluyen equipo (ADMIN/MODERATOR/COLLABORATOR) y cuentas bloqueadas; decisión del propietario |
| Series completadas y viendo | Mezcla de CURATED, contenido oculto y distintos filtros entre resumen y rankings | Una fila de estado actual por cuenta y obra pública, incluyendo obras accesibles de /ver |
| Actores/directores/productoras/países/tipos | Distinto alcance de obras y cuentas | Mismo universo de seguimiento público; actores de serie y temporada sin duplicar, sin placeholders |
| Catálogo | Contaba obras ocultas y WATCHABLE_ONLY como catálogo | Solo CURATED + PERSONAL + VISIBLE; desgloses y total coinciden |
| Capítulos, gráfico y ranking mensual | Contaba filas de partes como capítulos y usaba la fecha de edición | Capítulo completo cuando todas las partes están vistas, fecha máxima de las partes; watchedDate con fallback a updatedAt solo si falta fecha |
| Calificaciones | Cada categoría pesaba como un voto y los desgloses tenían alcances distintos | Un voto por persona/obra: general si existe, promedio de categorías en otro caso; mismo universo en promedio, histograma y ranking |
| Streaming | Usaba chapter (marcaciones) como finalizaciones, ordenaba por suma de inicios y marcaciones | Usa play_start y view; ranking por inicios; finales registrados siguen visibles en total/gráfico aunque no tengan inicio en la ventana |
| Cociente de streaming | Recortaba a 100% cuando había más finales que inicios | Cociente de eventos, no retención de personas; null/— si no es calculable o supera 100% |
| Aperturas | Máximo entre tráfico operativo del hub y aperturas de series | Solo open_ver, con la misma población que los otros eventos |
| Marcaciones sin cuenta | Prometía capítulos exactos para un evento que puede ser una parte o un lote | Etiqueta honesta de acciones de marcado; no se inventa un backfill |

Los períodos públicos usan días UTC, incluido el día actual. Las finalizaciones de streaming son videos (incluidas partes) que notificaron 80% o fin, no capítulos ni personas únicas. YouTube/Vimeo proporcionan esos eventos; otras plataformas pueden no hacerlo. No se vinculan sesiones retrospectivamente.

Se conserva ISR de 15 minutos y el timestamp de generación. No hay polling. Cambiar un favorito invalida solo las URLs de esa obra, estadísticas y la ruta pública de estadísticas; el botón refresca la ficha después de guardar. Un cero o un total pequeño puede ser correcto: no se rellena con datos del equipo ni estimaciones.

## Integridad adicional del seguimiento

La revisión ampliada solicitada por el propietario encontró que los DELETE directos de series, temporadas, episodios y aportes podían borrar seguimiento/notas por cascada, a diferencia de la edición curada. `deleteUntrackedContent` aplica la protección existente dentro de una transacción con bloqueos de filas. Devuelve 409 con la clave traducida ya existente; una obra o episodio sin seguimiento sigue siendo eliminable. Se invalida la caché de las superficies afectadas. El helper de preservación también compone consultas completas antes de pasarlas al cliente Prisma compartido.

La prueba contra Next compilado comprueba los cuatro endpoints, rechaza usuarios sin rol, conserva estados/notas y permite borrar episodios hermanos o temporadas sin seguimiento. No se borra contenido real en estas pruebas.

## Validación

- `scripts/test-public-statistics-consistency.ts`: datos sintéticos con roles, bloqueo, obras públicas/ocultas/no accesibles, capítulos parciales/completos y extras, fechas pasadas/futuras, créditos de temporada, votos por categorías y eventos de streaming. Comprueba conciliación de totales/desgloses y casos donde el cociente no existe.
- `scripts/test-community-statistics.ts`: regresión de reseñas con el filtro de comunidad unificado.
- `scripts/test-community-statistics-ui.mjs`: componentes reales con Chromium, streaming incluido, 1280 y 390 px, sin desborde ni errores de página.
- Auditoría de 3.889 claves en los diez idiomas, sin faltantes ni diferencias de variables.
- Primera corrida completa Docker: 74 pasos aprobados en 12m23s, ocho advertencias de lint anteriores. Una comprobación HTTP adicional detectó un 500 en `/api/stats/public`: los fragmentos SQL de un bundle se trataban como parámetros por el cliente Prisma compartido de otro bundle. Se corrigió construyendo la consulta completa con `Prisma.sql` antes de pasarla al cliente.
- `scripts/test-public-statistics-app.mjs` queda incorporado a la fase final de la suite: calienta auth, consulta la API compilada con datos reales sintéticos, verifica la página pública, favoritos de comunidad frente a equipo y la invalidación real de la ficha tras un toggle autenticado.
- La entrega está condicionada a una nueva corrida completa del hook pre-push sobre el commit final, incluyendo esa regresión. No se omite el hook.
- El chequeo nativo inicial encontró cuatro errores en scripts antiguos de `test-results/`. Se excluye esa carpeta de artefactos del tsconfig, sin modificar los archivos ajenos; así no entran en el chequeo del proyecto. TypeScript también se valida en el contenedor limpio y durante el build.

## Límites

No se consultó la base de producción ni se alteraron registros históricos. La página pública se inspeccionó en lectura; el diagnóstico de las causas se verificó contra el código y fixtures locales. Los agregados anónimos no permiten reconstruir identidades, sesiones, partes o lotes antiguos. La corrección no promete que cualquier plataforma emita telemetría ni que los totales de seguimiento coincidan con los del reproductor: miden acciones distintas.

## Ampliación: reportes administrativos

El propietario identificó `/admin/stats`, `/admin/informe-productoras` y `/admin/piloto` antes del despliegue. El primer lote pasó las 74 etapas del hook en 13m51s y se publicó en main; se pospuso el deploy para integrar esta ampliación y la auditoría de dependencias solicitada después.

- Admin: consultas frescas con `private, no-store`, comunidad y obras públicas como en estadísticas públicas, un voto por persona/obra, fecha vista (registro solo si falta), 30 días UTC completos y cuenta de series en la tabla de usuarios sin sumar episodios. Los errores tienen reintento; no se interpreta una respuesta 500 como datos.
- Productoras: límites inferior y superior por día UTC, COLLABORATOR excluido de cuentas, actividad pública y streaming con el mismo alcance que `/estadisticas`. Consultas SQL compuestas antes de pasar al cliente Prisma. Las marcaciones se presentan como acciones, las finalizaciones como videos, los seguidores como estado actual. Se explican los topes de tablas y la atribución al canal con más videos, que no demuestra qué canal recibió cada reproducción histórica.
- Piloto: lectura dinámica de los últimos 60 días UTC, sin fechas futuras ni ubicaciones desconocidas. Los clics del equipo y de cuentas bloqueadas ya se excluían al registrar; no son datos de ejemplo. La interfaz aclara el alcance y la limitación de clics repetidos de 30 segundos.
- Los tres reportes muestran fecha de consulta y actualización manual. Las dos páginas de servidor ya eran dinámicas; la falta de movimiento no demuestra por sí sola un caché o datos estáticos.
- Regresiones ampliadas: conciliación admin/público, ventanas productoras 30/90 días, modificaciones visibles en lecturas nuevas, rutas compiladas autenticadas, exclusión/incremento real del piloto y UI 390/1280 con fallo/reintento.

### Origen de las solicitudes de medición

La regresión HTTP compilada encontró 403 en el piloto al acceder por 127.0.0.1: NextURL normaliza ese host a localhost. Las rutas de comunidad ya contemplaban esa diferencia. `request-origin.ts` centraliza el criterio (Host real y protocolo; sin confiar en x-forwarded-host) para actividad, tráfico, clics, consentimiento y mutaciones administrativas que repetían la comparación defectuosa. Las rutas que exigían Origin siguen exigiéndolo; comunidad conserva su política anterior para solicitudes sin Origin. Se rechazan origen externo, protocolo diferente, origen inválido y Sec-Fetch-Site cross-site. Este fallo se reprodujo localmente; no se presenta como causa demostrada de todos los valores bajos de producción.
