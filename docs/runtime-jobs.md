# Runtime: tareas manuales y programadas

El cron diario ya ejecutaba videos y limpieza. La ingesta de noticias se incorporó el 26/09 después de la última corrida registrada; las propuestas se guardan en News con estado REVIEW, no en Announcement.

## Cambio

Runtime permite elegir videos/estadísticas, noticias o el flujo diario completo. Ambos disparadores llaman a runRuntimeJob. El POST manual requiere ADMIN; el GET programado conserva CRON_SECRET. Un advisory lock transaccional en PostgreSQL evita superposición entre instancias, también en el endpoint manual anterior. No requiere migraciones.

La búsqueda deja propuestas para revisión. Se muestran candidatos, fuentes consultadas y fuentes fallidas, con advertencia si la consulta fue parcial. Todas las fuentes fallidas producen error. YouTube tiene timeout de 8 segundos por petición. Los resultados de videos invalidan los listados públicos. El límite existente de 500 videos y el presupuesto temporal se conservan; las tareas continúan procesando los registros más antiguos en las siguientes corridas.

## Evidencia

- test-runtime-jobs.mjs: PostgreSQL local real para bloqueo concurrente y liberación; tareas externas simuladas. Verifica permisos, JSON inválido, selección, flujo completo, fallo parcial, disparador y revalidación. Agregado al CI.
- TypeScript y lint de los archivos modificados aprobados.
- Ejecución real de noticias: 23 fuentes, 4 fallidas, 12 propuestas REVIEW. Confirmadas en /admin/noticias; no publicadas.
- Contenido solicitado agregado solo a /ver: Only Boo! (673), GAP The Series (674), Secret Crush on You (675). Los dos últimos son de Idol Factory. Canales, estado público, permiso de embed y disponibilidad en mercados principales verificados con YouTube Data API. Sin avances en las temporadas. Never Let Me Go y Wandee Goodday descartadas por bloqueo regional.
- Pendiente editorial: reparto, directores y carátulas específicas de las incorporaciones (usan miniaturas oficiales). No se modificó el catálogo PERSONAL.
- Hallazgo aparte: guardar una ficha WATCHABLE_ONLY desde el editor redirige a /series y muestra 404; su URL pública correcta es /ver. No se amplía este cambio con ese arreglo.

PR #88 quedó mergeada y desplegada previamente. Respaldo completo y migración 20260926234951_watching_preferences verificados antes del merge. Esta entrega de Runtime todavía debe desplegarse.

## Noticias en español y fuentes asiáticas

Los extractos públicos se traducen y parafrasean con el helper existente de Gemini antes de crear propuestas REVIEW. Se conservan enlace, fuente y fecha; se marca aiGenerated. Una respuesta incompleta, inválida o fallida aborta la creación del lote y queda registrada como error para reintentar. El límite de traducción es 20 segundos, compartido entre los modelos de fallback. La revisión editorial sigue siendo obligatoria: el indicador de idioma del modelo no reemplaza una revisión humana.

La detección de avances reconoce tailandés, coreano, japonés y chino, además de inglés, y excluye avances de episodios y OST. Usa los canales oficiales ya verificados (incluidos Idol Factory, Strongberry y GagaOOLala) y los sitios de noticias configurados, como Soompi. No se agregaron sitios sin verificar ni se publica automáticamente.

Pruebas adicionales: validación de lotes de traducción, IDs duplicados/faltantes, idioma declarado incorrecto, errores y detección de avances multilingües.
