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
- Hallazgo aparte: guardar una ficha WATCHABLE_ONLY desde el editor redirige a /series y muestra 404; su URL pública correcta es /ver. El cierre posterior corrige la redirección y los enlaces del editor de temporadas y de Novedades usando getContentUrl.

PR #88 quedó mergeada y desplegada previamente. Respaldo completo y migración 20260926234951_watching_preferences verificados antes del merge. Runtime se integró en la PR #89 y quedó desplegado en producción (main 48d6592).

## Noticias en español y fuentes asiáticas

Los extractos públicos se traducen y parafrasean con el helper existente de Gemini antes de crear propuestas REVIEW. Se conservan enlace, fuente y fecha; se marca aiGenerated. Una respuesta incompleta, inválida o fallida aborta la creación del lote y queda registrada como error para reintentar. El límite de traducción es 20 segundos, compartido entre los modelos de fallback. La revisión editorial sigue siendo obligatoria: el indicador de idioma del modelo no reemplaza una revisión humana.

La detección de avances reconoce tailandés, coreano, japonés y chino, además de inglés, y excluye avances de episodios y OST. Usa los canales oficiales ya verificados (incluidos Idol Factory, Strongberry y GagaOOLala) y los sitios de noticias configurados, como Soompi. No se agregaron sitios sin verificar ni se publica automáticamente.

Pruebas adicionales: validación de lotes de traducción, IDs duplicados/faltantes, idioma declarado incorrecto, errores y detección de avances multilingües.


## Cierre verificado el 27/09/2026

- Runtime manual en producción: noticias ejecutadas sin esperar al cron. Una repetición devolvió 0 nuevas sobre 12 candidatas, sin duplicarlas.
- Las ocho propuestas antiguas en inglés se resumieron en español, conservando fuente, fecha, enlace y estado REVIEW. No se enviaron notas privadas al proveedor de IA ni se publicaron propuestas.
- Agregada la fuente japonesa BLドラマ情報局 (https://bl-data.com/feed/), después de comprobar su RSS. La siguiente ejecución devolvió 4 nuevas, 16 candidatas, 24 fuentes y 4 fallidas. Las cuatro nuevas quedaron en español y REVIEW: 16 propuestas en revisión en total. Noticias y anuncios son entidades distintas; las propuestas se revisan en /admin/noticias.
- Recuperadas las 16 fichas sin imagen: 415, 439, 454, 516, 583, 584, 585, 586, 637, 655, 661, 667, 668, 670, 671 y 672. Se verificó correspondencia por título, título original, reparto o episodio. Se usaron imágenes de plataformas, distribuidoras y canales públicos; Proxy Driver, The Gaze y My Captor Was My Beloved se contrastaron con fichas de metadatos. Connecting to You Special usa la imagen de la serie principal y The Middleman's Love reutiliza la de su ficha equivalente. Varias imágenes son miniaturas promocionales, no pósteres verticales.
- Las imágenes se guardaron con el helper existente, generando también miniatura. En este entorno se utilizó el fallback de Supabase Storage. Solo se actualizaron campos de imagen vacíos; no se modificaron avances, reseñas ni episodios. La evidencia y procedencia detallada quedaron en test-results/restored-covers*.json, ignorados por Git.
- Borrada la rama remota codex/biblioteca-sincronizada con autorización explícita del usuario, después de comprobar que era ancestro de main.
- Corrección del editor: guardar una ficha WATCHABLE_ONLY y guardar/volver desde su temporada ahora utiliza /ver; las fichas de catálogo conservan /series. Se reutiliza getContentUrl y se pasan origin/catalogScope desde la consulta de temporada. Sin cambios de esquema ni nuevas traducciones.
- Validación del arreglo: TypeScript, ESLint de los archivos modificados y build de producción con PostgreSQL local aprobados. Su despliegue depende de integrar la PR de cierre.

### Pendientes acotados

- Revisar editorialmente las 16 noticias antes de publicarlas, especialmente afirmaciones comerciales o de disponibilidad regional procedentes de las fuentes.
- Diagnosticar o reemplazar las cuatro fuentes que fallan. El resultado parcial se muestra como degradado; no significa que el cron nunca haya corrido.
- Completar reparto/directores y pósteres verticales específicos de Only Boo!, GAP y Secret Crush on You. Ya están disponibles en /ver con miniaturas oficiales; no se inventaron créditos ni se mezclaron con el catálogo PERSONAL.


## Revisión editorial y fuentes — 27/09/2026

Los 16 enlaces originales respondieron HTTP 200 y se contrastaron títulos y extractos. Se corrigió la atribución del artículo de opinión 4 y los títulos/resúmenes 13–16: las guías japonesas no acreditan acceso gratuito internacional; Addicted Love y The Chemistry todavía no tenían plataforma/fecha anunciadas según las propias fuentes. Las 16 propuestas conservan REVIEW. La revisión no equivale a verificar independientemente cada afirmación de los medios ni autoriza publicación automática.

Only Boo! (673), GAP (674) y Secret Crush on You (675) tienen ahora dos protagonistas con sus personajes y director. Se reutilizaron las identidades existentes (incluidas las transliteraciones Sakon Wong/Golf y Natthaphong Wongkaweepairod/A); se crearon Freen y Becky mediante el helper de deduplicación. Fuentes: descripciones oficiales de GMMTV e IdolFactory en los videos zbAcWH2TF-s y pBl9uKcZFXo; fichas de distribución de Apple TV de GAP y Secret Crush on You. Solo se completaron estas tres fichas WATCHABLE_ONLY. Se sustituyeron las miniaturas de episodios por arte específico verificado visualmente en TVmaze: fichas 71988, 64662 y 56582 (GAP tiene arte cuadrado; las otras dos, vertical). Versiones previas y resultados están en test-results/editorial-inventory.json y editorial-images-uploaded.json, ignorados por Git.

### Auditoría de fuentes

| Fuente | Hallazgo | Tratamiento |
| --- | --- | --- |
| Mundo Asia | Falla de conexión | Consulta automática pausada |
| CafeBL | Falla de conexión | Consulta automática pausada |
| BLTai | RSS responde HTTP 403 | Consulta automática pausada; no se elude el bloqueo |
| BLUPDATE | Perfil de Twitter sin RSS; devuelve HTML | Consulta automática pausada |
| GagaOOLala | El ID anterior pertenecía a un canal homónimo vacío | Corregido a UCAv7YCgnRo86h7gOMMBf-GQ, @gagaoolalaofficial, contrastado con YouTube Data API |

La pausa vive en news-source-policy.ts y no elimina los sitios recomendados. Nombre y motivo se registran en skippedSources en los metadatos de la tarea; el contador de fuentes cuenta las efectivamente consultadas. Para reactivar un dominio, comprobar su RSS público y retirar su entrada de esa política. Esto resuelve los intentos automáticos repetidos, no repara sitios externos. Una respuesta HTML 200 ya no se interpreta como un feed vacío exitoso. Fallos de descubrimiento quedan aislados por fuente.

El prompt de traducción preserva regiones, atribución y anuncios pendientes; no garantiza por sí solo la calidad editorial. Las propuestas siguen requiriendo revisión. Prueba real dry-run: 20 fuentes consultadas, 0 fallidas, 16 candidatas, 0 nuevas; sin traducciones ni escrituras. Pruebas de regresión: pausas sin fetch, dominio impostor no pausado, HTML rechazado, RSS/Atom vacíos válidos y URL inválida aislada. Agregadas al CI.

Las correcciones de datos ya se aplicaron. La política y la corrección del canal entran en producción cuando se integre esta PR. Pendiente de decisión editorial: publicar las noticias revisadas; no se publicaron automáticamente.
