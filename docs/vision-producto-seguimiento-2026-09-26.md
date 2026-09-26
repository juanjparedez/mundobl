# MundoBL: seguimiento personal, curaduría y descubrimiento

Fecha: 2026-09-26. Estado: propuesta de producto basada en la conversación y en una revisión del código local. Este documento no implica que las capacidades propuestas estén implementadas ni verificadas en producción.

## Objetivo

Que las personas vuelvan porque MundoBL les permite conservar su experiencia, continuar sus series y descubrir conexiones relevantes, con privacidad y control. La identidad editorial pertenece a Flor. El crecimiento de BL y GL para ver debe fortalecer esa identidad sin modificar su catálogo por vías indirectas.

Promesa propuesta: **Tu mundo de series, a tu manera. Organizá lo que ves, guardá tu historia y descubrí qué seguir.** La oferta de reproducción se comunica por separado y según disponibilidad real.

## Tres ámbitos conectados

| Ámbito | Contenido y autoridad | Relación con los otros ámbitos |
| --- | --- | --- |
| Catálogo de Flor | Selección, reseñas editoriales, etiquetas y datos aprobados por Flor. | Aporta información al seguimiento y enlaces a reproducción cuando existe. |
| Para ver | BL y GL disponibles mediante las fuentes admitidas; aportes de colaboradores con permisos delimitados. | Se pueden seguir aunque no pertenezcan al catálogo de Flor. Un aporte no se convierte automáticamente en contenido curado. |
| Mi seguimiento | Estados, fechas, vueltas, notas, listas, calificaciones y preferencias del usuario. | Reúne títulos de ambos ámbitos sin modificar sus fichas ni su clasificación editorial. |

Una obra presente en ambos ámbitos debe conservar una identidad coherente y un único seguimiento por usuario. La disponibilidad del video puede cambiar sin borrar lo que la persona vio o escribió. No llamar «mi catálogo» al seguimiento en interfaces donde pueda confundirse con editar el catálogo de Flor.

## Control editorial

- Colaboradores pueden cargar y mantener su contenido para ver dentro del alcance que Flor les otorgue.
- Solo Flor o una delegación editorial explícita decide pertenencia al catálogo, taxonomía canónica y cambios en fichas curatoriales.
- Reutilizar una entidad aprobada no otorga permiso para editarla. Nuevos nombres, créditos y etiquetas propuestos por colaboradores requieren un estado de propuesta o un ámbito separado hasta su aprobación.
- Las etiquetas personales pertenecen al usuario y no se convierten en etiquetas públicas.
- Mostrar procedencia de los datos y quién aporta o verifica el contenido; no atribuir a Flor opiniones de usuarios o descripciones de colaboradores.
- Una fusión de obras debe preservar seguimiento, notas, comentarios y referencias. La desaparición de un embed no debe eliminar la historia personal.

## Seguimiento y diario

Página principal con Continuar, Biblioteca, Historial y Estadísticas. Configuración progresiva: una vista inicial útil, más opciones para quien las necesite.

- Vistas compacta y visual; filtros guardados, orden, secciones visibles y series fijadas. Preferencias sincronizadas en la cuenta; indicar cuando solo se guardan en el dispositivo.
- Acciones por episodio, selección de rangos, «vi hasta acá», deshacer y edición de fecha.
- Pausar, abandonar, completar y volver a ver sin perder las vueltas anteriores.
- Diferenciar capítulos de partes de video y «al día con lo publicado» de «serie terminada».
- Permitir seguimiento manual y control del marcado automático cuando la plataforma lo soporte.
- Integrar notas privadas y acceso a conversaciones públicas desde el episodio y el historial, con acciones de guardado/publicación distintas.
- Historial con fecha de visionado, fecha de registro y procedencia manual/automática/importada. No inventar fechas históricas que no existen.
- Protección de spoilers por episodio; notas privadas nunca públicas por cambiar un ajuste general. Compartir una nota crea un borrador público que la persona revisa.

## Importar y modificar el seguimiento

Entradas propuestas: archivo CSV/JSON, texto pegado y un formato documentado para scripts o asistentes. Ejemplo: «Terminé A; de B vi hasta el capítulo 6; C la abandoné».

Flujo: interpretar → encontrar coincidencias → revisar cambios concretos → aplicar → mostrar resultado y permitir revertir el lote cuando no haya cambios posteriores incompatibles.

- Mostrar antes/después, títulos ambiguos, referencias inexistentes, fechas desconocidas y conflictos con el progreso actual.
- Identificar obras por referencias estables, título alternativo y año cuando corresponda. No elegir silenciosamente entre remakes.
- Lo no reconocido queda pendiente de resolución; nunca crea series, actores o etiquetas editoriales.
- La misma operación repetida no duplica visionados. Una importación no marca hoy como fecha de visionado salvo que el usuario lo declare.
- Separar restauración de respaldo de edición de seguimiento. Modificar lo existente es una operación explícita y revisable.
- Exportar episodios, vueltas y notas además del estado general de la serie; permitir volver a importarlos sin pérdida semántica.
- IA opcional para preparar propuestas. Explicar qué texto se enviará al proveedor; las notas privadas no se incluyen por defecto. Reutilizar Gemini según las reglas del proyecto.
- Una futura API para automatización debe operar únicamente sobre el seguimiento autorizado de la cuenta, con permisos revocables. El usuario no necesita entregar credenciales de sesión a una herramienta externa.

## Estadísticas personales

Vistas por período, países, géneros, etiquetas, actores, dirección, guion y productoras. Cada cifra permite abrir los registros que la componen.

- Separar obras únicas de veces vistas; las vueltas cuentan como actividad sin inflar el número de títulos distintos.
- Tiempo estimado a partir de duración declarada debe decir «estimado» y señalar datos faltantes. No presentarlo como minutos realmente reproducidos.
- Usar fechas de visionado para el historial temporal; registros sin fecha quedan en un grupo separado.
- Permitir incluir o excluir importados, abandonados, vueltas y ámbitos de contenido.
- El resumen mensual/anual es privado por defecto. Compartir requiere elegir qué mostrar.

## Un mundo de contenido relacionado

Conectar obras, temporadas, universos, actores, directores, guionistas, productoras, adaptaciones, entrevistas, música y referencias externas. Fotos y datos deben tener procedencia; la falta de información se presenta honestamente.

Cada entidad necesita una ruta útil hacia las obras relacionadas y el seguimiento. Los créditos deben representar el rol, sin tratar a un guionista como director para reutilizar una pantalla. La consulta del catálogo de Flor conserva su alcance; explorar contenido para ver puede mostrar otro alcance claramente identificado.

Recomendaciones explicables: «Comparte guionista con una serie que calificaste bien», «Mismo tono y episodios más cortos». Ver una obra no equivale a que haya gustado. Usar preferencias explícitas y señales comprensibles; permitir excluir títulos, características o apagar la personalización. No usar pagos, publicidad ni urgencia artificial para ordenar.

No inferir identidad, orientación u otros atributos personales a partir del consumo. Las notas privadas quedan fuera del sistema de recomendaciones por defecto.

## Comunidad y motivos de regreso

Comunidad con entrada visible: conversaciones seguidas, discusiones por episodio y recomendaciones con una obra adjunta que se pueda guardar. No requiere publicar el historial personal.

Primero conectar comentarios, respuestas y seguimiento. Después evaluar salas por serie/estreno y mensajes privados con controles de contacto, bloqueo y silencio. Un chat general aislado no sustituye el recorrido principal.

Motivos de regreso propuestos: continuar donde quedó, consultar una nota, registrar lo visto, descubrir una conexión, recibir una respuesta o encontrar contenido nuevo de una obra/persona seguida. Avisos opcionales, configurables y basados en cambios reales; sin penalizaciones por ausentarse ni rachas obligatorias.

## Claridad y SEO

La misma promesa debe verse en resultados de búsqueda, títulos, descripciones, tarjetas, buscador interno, ficha y acción principal.

| Situación | Mensaje y acción propuestos |
| --- | --- |
| Ficha curada sin reproducción | «Ficha, reseña y seguimiento»; «Agregar a mi seguimiento». Explicar que no se reproduce acá. |
| Reproducción verificada | «Ver episodios disponibles»; mostrar fuente, capítulos y restricciones conocidas. |
| Solo algunos episodios disponibles | Mostrar cuántos; no anunciar la serie completa. |
| Solo tráiler | Identificarlo como tráiler; no ofrecerlo como episodio. |
| Disponibilidad desconocida o cambiante | Indicar que falta confirmar; no afirmar disponibilidad completa. |
| Enlace externo | «Ver en [plataforma]», diferenciado de reproducción dentro de MundoBL. |

Los datos estructurados y sitemaps deben reflejar esas mismas condiciones. Un enlace roto debe permitir continuar usando la ficha y el seguimiento. No prometer una biblioteca futura como si ya estuviera disponible. La futura ampliación BL/GL se comunica como dirección del proyecto, sin títulos ni fechas no confirmados.

## Evidencia del estado local

Revisión de código, no auditoría de producción ni verificación funcional completa:

- `src/components/watching/CurrentlyWatchingDashboard.tsx`: seguimiento actual con tarjetas, próximo capítulo, notas de serie y acciones básicas. `src/app/api/currently-watching/route.ts` reúne VIENDO y RETOMAR.
- `prisma/schema.prisma`: ViewStatus conserva estado/fechas por entidad y usuario, sin un modelo de eventos de visionado o vueltas. EpisodeNote, SeriesNote y Comment ya existen.
- `src/app/api/user/notes/route.ts`: ya reúne notas privadas en un diario. Debe integrarse, no recrearse como sistema paralelo.
- `src/app/api/user/profile/route.ts`: ya calcula estadísticas personales y duración derivada de episodios. Auditar la metodología al ampliar el historial.
- `src/app/api/user/account/import/route.ts`: restauración JSON con dry-run y merge. El bloque viewStatuses requiere seriesId y omite conflictos con skipDuplicates; no restaura estados por episodio ni permite corregir progreso existente.
- `src/app/api/user/account/export/route.ts`: exporta ViewStatus, pero no consulta EpisodeNote ni SeriesNote. La portabilidad completa del diario está pendiente.
- `src/app/api/user/series/embed/confirm/route.ts` y `src/lib/tag-utils.ts`: aportes pueden crear entidades compartidas por nombre. Separar origin/catalogScope en los listados no demuestra control exclusivo de la taxonomía editorial.
- No se encontró un modelo específico de guionistas en el schema inspeccionado. Diseñar créditos y migración antes de prometer navegación por guion.
- `context.md` describe separación de ámbitos, colaboradores, dashboards configurables y progreso local. Contiene secciones históricas con diferencias entre sí: validar cada implementación contra el código actual.
- `docs/politica-contenido-oficial.md` define las fuentes admitidas para ampliar contenido. Este plan no cambia esa política.

## Orden de trabajo y evidencia de aceptación

| Entrega | Resultado | Evidencia necesaria |
| --- | --- | --- |
| 1. Identidad y control | Contrato editorial y disponibilidad coherentes en todas las entradas. | Verificar permisos de colaboradores, creación de entidades, buscador, fichas y metadata; un aporte GL no altera catálogo ni taxonomía curada. |
| 2. Seguimiento central | UI configurable, control de episodios, historial y notas/comentarios conectados. | Recorrido móvil/escritorio con marcado, deshacer, fecha, pausa y vuelta; aislamiento entre cuentas y persistencia entre dispositivos. |
| 3. Portabilidad | Importación manual, por archivo y asistida; exportación completa. | Lote ambiguo revisable, reintento sin duplicados, conflicto explícito, exportar/reimportar episodios y notas; cero mutaciones curatoriales. |
| 4. Estadísticas | Cifras trazables al historial. | Casos con fechas ausentes, importados, partes, vueltas y duración desconocida; cada cifra coincide con su detalle. |
| 5. Contenido relacionado | Créditos, referencias, fotos y descubrimiento explicable; crecimiento BL/GL en /ver. | Fuentes verificadas, navegación por roles, permisos editoriales y recomendaciones con motivo/exclusión; reproducción comprobada por muestra y estado actualizado. |
| 6. Comunidad | Conversaciones y recomendaciones accesibles desde lo que se ve. | Publicación deliberada, respuestas, spoilers, controles de contacto y ausencia de exposición del seguimiento privado. |

Medir utilidad: tiempo hasta el primer registro, éxito al importar, facilidad para retomar, retorno al seguimiento y discrepancias entre disponibilidad anunciada y real. Hoy no hay evidencia suficiente para atribuir las visitas únicas a una causa concreta. Combinar pruebas de uso voluntarias con medición mínima y transparente; no agregar rastreo invasivo para medir retención.

## Avance de implementación local

2026-09-26: se amplió el respaldo/restauración para incluir notas privadas y estados por temporada/episodio; se tradujeron los nombres de las secciones y advertencias de la vista previa. Ver `seguimiento-respaldo.md` para el contrato, las verificaciones y los límites. Los hallazgos anteriores describen el punto de partida, no el estado posterior de esos dos endpoints.

La propuesta completa sigue pendiente de implementación y validación. Este documento conserva el alcance; ninguna entrega parcial demuestra el objetivo total.

2026-09-26: primera implementación del espacio de seguimiento con búsqueda, filtros, lista/tarjetas, orden y fijados por dispositivo. El panel de episodios conecta marcado, notas privadas y conversaciones públicas existentes; el diario privado se integra en una pestaña. Los contadores describen solamente las series en curso. Los aportes para ver conservan su ruta `/ver` y se distinguen del catálogo de Flor.

Validación local: TypeScript y ESLint; pruebas puras del progreso/selección; recorrido Playwright con todas las APIs simuladas, incluidos guardado de nota, publicación deliberada de comentario, marcado parcial y adaptación móvil. Esto no demuestra persistencia real, aislamiento de permisos del servidor ni funcionamiento de producción. Quedan pendientes historial/vueltas, edición de fechas, sincronización de preferencias, biblioteca completa y comunidad agregada.

2026-09-26: los formularios de aportes público y de colaborador permiten buscar vocabulario existente. Sus endpoints ya no crean entidades compartidas: rechazan nombres ausentes o ambiguos antes de guardar. Se preserva el formulario, con explicación traducida. El guard de colaboradores exige también el ámbito WATCHABLE_ONLY y el PATCH de ficha vuelve a comprobar la propiedad al escribir. El alta pública se volvió transaccional. Los handlers y el selector se probaron con dependencias simuladas, además de TypeScript y ESLint.

Límites de este avance: falta un flujo de propuesta/aprobación de entidades nuevas que conserve automáticamente lo sugerido; el colaborador debe pedir la incorporación editorial. No se reclasificaron entidades históricas ni se cambiaron los permisos editoriales existentes de ADMIN/MODERATOR. Sigue pendiente revisar el conjunto de endpoints y validar la concurrencia y los permisos sobre PostgreSQL real. Este avance no demuestra todavía control exclusivo de Flor en toda la aplicación.

2026-09-26: corregido el sobrescrito de fechas al repetir un marcado o marcar rangos/partes. Un reintento conserva fechas conocidas o desconocidas y no reanuda una pausa. Se habilitó y documentó un entorno SQL temporal PGlite: reconstrucción de 47 migraciones, diff de schema sin diferencias, pruebas de progreso, restauración y resolución editorial. El fallo SQL deliberado para verificar rollback y la concurrencia nativa quedan pendientes por limitaciones del transporte temporal. Esto protege la base de datos del seguimiento actual, pero no implementa todavía el registro de múltiples visionados ni la edición de fechas.

2026-09-26: implementada la pestaña Historial privado con búsqueda, paginación y borrado confirmado que conserva progreso/notas. TrackingEvent registra cambios transaccionalmente; estados anteriores se identifican como snapshots y fechas desconocidas siguen desconocidas. Exportación/importación y respaldo global incluyen eventos. Verificado sobre PostgreSQL nativo local: progreso, rollback, reintentos concurrentes de marcas existentes, aislamiento, restauración y comparación de 63 tablas. Playwright verificó el recorrido visual con APIs simuladas. Las referencias anteriores al historial pendiente quedan acotadas: siguen pendientes múltiples visionados explícitos, edición de fechas desde UI y estadísticas derivadas. No se aplicó la migración en producción.
