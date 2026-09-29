# Manual de mantenimiento de MundoBL

Revisión: 28/09/2026. Responsable operativo: Juan. Aplicación: `mundobl.com.ar`.
Este manual distingue configuración del repositorio, comprobaciones en producción y datos pendientes del panel. Las cuotas pueden cambiar: verificar siempre el plan, la organización, la métrica y el período antes de actuar.

## 1. Diagnóstico del aviso actual

El panel de Supabase de la organización `devsolutions`, plan Free, muestra **“Grace period is over”** y advierte que los proyectos dejarán de atender solicitudes al agotar la cuota. Es un riesgo de interrupción real. El aviso puede persistir aunque el uso vuelva a estar debajo del límite: no demuestra por sí solo un bloqueo actual, pero tampoco concede otro período de gracia. [Política oficial](https://supabase.com/docs/guides/platform/billing-faq).

`Healthy` describe el estado actual del proyecto. No demuestra que quede cuota. `No backups` no confirma ni descarta los backups externos en R2; `No migrations` tampoco sustituye la revisión del historial de Prisma.

### Evidencia comprobada

| Comprobación                                 | Resultado                                                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR de mitigación                             | [#107](https://github.com/juanjparedez/mundobl/pull/107), mergeada el 28/09/2026 a las 06:04 UTC; commit `6b815cf418c9a5160fcb6e389a1e998501045b98` |
| Producción, consulta pública a las 06:11 UTC | `/api/build-info` devuelve `buildId: 6b815cf`                                                                                                       |
| Caché de `/ver/676` y `/series/1`            | GET anónimos: HTTP 200, primero `X-Vercel-Cache: MISS`, luego `HIT`; ambas con `X-Nextjs-Prerender: 1`                                              |
| Backups configurados en Git                  | `.github/workflows/backup.yml`: domingos 07:00 UTC (04:00 Argentina), retención de 14 días; requiere `BACKUPS_ENABLED=true`                         |
| Deploys automáticos configurados             | `vercel.json`: habilitados para `main`; cron de aplicación diario a las 05:00 UTC                                                                   |
| Acceso a métricas privadas                   | El conector Vercel devolvió 403 para el equipo del proyecto. No se obtuvieron métricas privadas de Supabase ni últimas copias de R2                 |

La muestra prueba caché en dos páginas y confirma el commit publicado. No prueba el ahorro total ni el funcionamiento de todas las rutas, APIs o sesiones. No se borraron deployments, datos ni imágenes durante esta revisión.

### Afirmaciones anteriores que no deben darse por ciertas

- **“El corte de Hobby es a las 16 horas”**: la documentación publica **4 CPU-h de Active CPU incluidas**. Las 16 horas no están verificadas como umbral aplicable a esta cuenta. Si el panel muestra una tolerancia especial, registrar esa evidencia; no presupuestarla como cuota gratuita. [Vercel Hobby](https://vercel.com/docs/plans/hobby).
- **“450 personas por mes alcanzan de sobra”**: faltan bytes transferidos, consultas, tráfico automatizado, APIs, regeneraciones y trabajos programados. Los visitantes humanos no equivalen al consumo facturable.
- **“Cada deploy borra toda la caché”**: es demasiado general. Vercel conserva contenido ISR para rollback y existen capas de caché distintas. Evitar deploys innecesarios ayuda, pero atribuirles el exceso exige métricas. [ISR en Vercel](https://vercel.com/docs/incremental-static-regeneration).
- **“Los contadores se reinician igual en ambos proveedores”**: confirmar cada ventana. Vercel Hobby documenta restricciones que normalmente pueden exigir esperar 30 días; no prometer recuperación el día 1. Supabase evalúa egress por ciclo y otras métricas mediante promedios.
- Los valores previos de CPU, escrituras ISR, número de deployments y pósters pendientes son antecedentes reportados, no mediciones actuales de esta revisión.

## 2. Qué hacer ante una alerta

1. Abrir la organización correcta y registrar el mensaje completo, fecha, cuota usada/límite, período y proyecto. En Supabase revisar primero toda la organización y después filtrar `mundobl`.
2. Clasificar la métrica con la tabla siguiente. Un problema de espacio no se corrige únicamente cacheando páginas.
3. Si ya hay restricción o la proyección supera el límite, actuar ese día: reducir el origen identificado; evaluar un cambio de plan o la espera indicada por el proveedor según la disponibilidad necesaria. Revisar precio y alcance antes de contratar.
4. Mantener backups verificados. Posponer dumps repetidos, crawls completos y reconstrucciones innecesarias; no generar carga masiva para “probar” el ahorro.
5. Registrar una segunda medición comparable a las 24 horas y otra a las 48 horas, considerando el retraso del panel. Ante bloqueo actual no esperar esas mediciones para intervenir.

| Métrica                                           | Qué significa y qué revisar                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Egress                                   | Bytes que salen de los servicios. Free incluye 5 GB sin caché y una cuota independiente de 5 GB con caché; no sumarlos como una bolsa intercambiable. Ver Database, Shared Pooler y Storage por separado. Prisma y backups por el pooler también pueden consumir egress. [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress) |
| Supabase Database Size                            | Free puede entrar en solo lectura al superar 500 MB de base. Es distinto del disco total. La restricción organizacional también puede depender del promedio del período. [Database Size](https://supabase.com/docs/guides/platform/database-size)                                                                                                     |
| Supabase Storage Size                             | Free incluye 1 GB; la evaluación por GB-h refleja el promedio del período. Borrar archivos reduce ocupación futura, pero puede no levantar una restricción inmediatamente. [Storage Size](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size)                                                                                   |
| Vercel Active CPU                                 | Tiempo de CPU ejecutando funciones. Revisar funciones/rutas y tráfico causante; distinguirlo de duración de build, memoria provisionada e invocaciones.                                                                                                                                                                                               |
| Vercel ISR Reads/Writes, transferencia e imágenes | Son métricas independientes. Cachear reduce ejecuciones, pero no convierte todos los recursos en gratuitos o ilimitados. Registrar cada cuota del panel.                                                                                                                                                                                              |

Para egress, borrar objetos o deployments no revierte transferencias ya realizadas. Si Supabase ya restringió por egress, su documentación indica que se recupera al comenzar el siguiente ciclo o al ampliar el plan correspondiente. Reducir el consumo evita empeorarlo, pero no borra el historial.

### Registro mínimo de seguimiento

Guardar mediciones privadas sin claves ni datos de usuarios:

| Fecha y zona horaria | Proveedor / organización        | Métrica                                        | Usado / límite        | Inicio / fin de período | Incremento 24 h      | Acción y resultado                             |
| -------------------- | ------------------------------- | ---------------------------------------------- | --------------------- | ----------------------- | -------------------- | ---------------------------------------------- |
| 29/09/2026 (panel)   | Supabase / devsolutions         | Egress                                         | 1,603 / 5 GB (32 %)   | 17/09 – 17/10           | ~0,13 GB/día (prom.) | Al ritmo actual cierra el ciclo en ~4 GB       |
| 29/09/2026 (panel)   | Supabase / devsolutions         | Cached Egress                                  | 0,042 / 5 GB (<1 %)   | 17/09 – 17/10           | —                    | Sin riesgo                                     |
| 29/09/2026 (panel)   | Supabase / devsolutions         | Database Size                                  | 0,125 / 0,5 GB (25 %) | 17/09 – 17/10           | —                    | Por SQL: 104 MB, 74 MB son `AccessLog`         |
| 29/09/2026 (panel)   | Supabase / devsolutions         | Storage Size                                   | 0,109 / 1 GB (11 %)   | 17/09 – 17/10           | —                    | 1286 objetos                                   |
| 29/09/2026 (panel)   | Supabase / devsolutions         | Log Ingestion (todavía no se cobra)            | 0,527 / 1 GB (53 %)   | 17/09 – 17/10           | ~44 MB/día (prom.)   | Al ritmo actual pasa 1 GB antes del 17/10      |
| 28/09/2026 23:24 ART | Vercel / juanjparedezs-projects | Deployments del proyecto                       | 6                     | —                       | —                    | Todos recientes; nada que borrar               |
| Pendiente            | Vercel / juanjparedezs-projects | CPU, ISR, memoria, invocaciones, transferencia | Pendiente             | Pendiente               | Pendiente            | Solo en Usage (Hobby no expone costos por API) |

Medición del 28–29/09/2026. Panel de Usage de Supabase (ciclo 17/09 – 17/10, día 12), más SQL y logs:

- **Ninguna métrica pasó la cuota.** El aviso de gracia queda fijo porque la gracia ya se usó (terminó el 10/09): si una métrica se pasa, Supabase puede responder 402 sin otro aviso. Spend cap activo, sin tarjeta.
- **Log Ingestion es la más cerca del límite**, pero Supabase la empieza a cobrar recién a principios de 2027; Log Query también. El Log Query del 28/09 (844 MB) fue casi todo por consultas de diagnóstico: no repetirlas sin motivo.
- **"Service restrictions are active" (11/09)** es del ciclo anterior. El 29/09 Storage y el sitio respondían 200: no había restricción.
- **Log Ingestion, detalle:** La documentación general dice 5 GB para Free, pero el panel de esta organización muestra 1 GB: tomar el panel. En las últimas 24 h, 21.500 de 22.700 líneas son de Supavisor, el pooler: cada función de Vercel que abre una conexión Prisma deja 2–3 líneas. Las conexiones por hora bajaron de ~1000 (04–07 UTC del 28/09, antes de #107) a ~100–400 después. Menos invocaciones de funciones = menos logs.
- **Base**: `AccessLog` son 74 MB: 94.062 `PAGE_VIEW` desde el 30/06. La retención de 90 días empieza a borrarlos ahora, así que el tamaño debería estabilizarse; "Limpiar logs vencidos" hoy no libera casi nada.
- **`PAGE_VIEW` ya no mide tráfico**: desde #107 el proxy solo corre en `/admin`, y es el proxy el que los registra. Bajó de ~600 por día a 44 en 20 h por eso, no por menos visitas. Para tráfico usar Vercel Usage.
- **Imágenes en Supabase**: 20 series (`imageUrl` e `imageThumbUrl`) y 12 `FeatureRequestImage.url`. Las 40 de series se subieron el 27/09 de madrugada (la última a las 01:30 ART). Producción tiene las cinco variables R2; el `.env` local no tiene ninguna, así que casi seguro vinieron de un entorno local apuntando a la base de producción. Antes de cargar series desde local, agregar las variables R2 al `.env`. Migrarlas con `scripts/migrate-images-to-r2.ts` (necesita esas variables). Temporadas, universos, personas, productoras, noticias y sitios: 0. Las otras 655 series ya están en R2.
- **Vercel**: 6 deployments de producción, todos del 27–28/09. No hay nada para borrar todavía.
- **Monitoreo desde la app**: la Management API de Supabase solo da cantidad de requests, no Egress ni Log Ingestion en GB. Esos dos se leen en el panel de Usage; no hay forma de traerlos a `/admin` sin scrapear.
- **Falta**: CPU, ISR, invocaciones y transferencia de Vercel. Leerlos en Usage y completar la tabla.

Para cuotas acumulativas: `margen = límite - usado`; `días estimados = margen / incremento diario`. Usar la tasa posterior al arreglo y la misma unidad; una tasa cero o negativa por retrasos/reinicio no permite extrapolar. Dejar margen para picos y backups. Esta fórmula no reemplaza la evaluación de promedios de almacenamiento.

## Deploys

Mergear a `main` no despliega: `vercel.json` tiene `git.deploymentEnabled: false`. Cada deploy hace un build que lee la base y arranca con la caché ISR vacía, así que se juntan varios merges y se despliega una vez.

1. Si hay migraciones, aplicarlas antes: `npm run migrate:supabase`.
2. GitHub → Actions → **Deploy producción** → Run workflow (rama `main`). Despliega el último commit de `main` con la CLI de Vercel.
3. Revisar el resumen del workflow y `/api/build-info`.

Requiere el secret `VERCEL_TOKEN` en GitHub (token de vercel.com/account/tokens limitado al team). Los crons de `vercel.json` siguen funcionando: se leen del deploy de producción. Rollback: Vercel → Deployments → Instant Rollback, no hace falta un deploy nuevo.

## 3. Vercel: inspección y limpieza de deployments

La limpieza retira versiones antiguas y sus URLs; no recupera CPU, builds o transferencia ya consumidos. Un deployment antiguo que recibe tráfico todavía puede ejecutar funciones. Primero identificar si eso ocurre.

Comandos para PowerShell, desde la raíz del repositorio. Requieren Vercel CLI instalado y una cuenta con acceso; estos comandos se documentaron, no se ejecutó ninguna eliminación:

```powershell
# Si falta la CLI, instalarla una vez.
npm install --global vercel
vercel login
vercel whoami
vercel teams ls

$vercelScope = 'juanjparedezs-projects'
vercel list mundobl --scope $vercelScope
vercel list mundobl --prod --scope $vercelScope
vercel list mundobl --environment preview --scope $vercelScope
vercel alias ls --scope $vercelScope
```

La lista es paginada: repetir con `--next TIMESTAMP` usando el cursor devuelto, no un valor inventado. Revisar fecha, estado, commit y alias. [Listar deployments](https://vercel.com/docs/cli/list).

Conservar producción actual, deployments con dominios/alias vigentes, previews en revisión y al menos dos versiones estables compatibles con la base actual para rollback. La antigüedad sola no vuelve descartable un deployment.

```powershell
# Sustituir por una URL única de deployment obtenida de la lista.
# No usar mundobl.com.ar ni el nombre del proyecto como candidato.
$deploymentCandidato = 'REEMPLAZAR-POR-URL-UNICA.vercel.app'
vercel inspect $deploymentCandidato --scope $vercelScope

# Solo después de revisar el candidato y sus alias. Mantiene confirmación.
vercel remove $deploymentCandidato --scope $vercelScope
```

**No ejecutar `vercel remove mundobl`**: usar el nombre del proyecto amplía la operación y puede eliminar el proyecto. `--safe` al operar por proyecto omite deployments con ciertos alias activos, pero no protege por sí solo todo el historial útil para rollback. No usar `--yes`, bucles masivos ni asumir que existe un dry-run de borrado. [Semántica oficial de remove](https://vercel.com/docs/cli/remove).

Para mantenimiento recurrente, preferir **Project → Settings → Security → Deployment Retention Policy**. Propuesta a revisar: previews/cancelados/fallidos 30 días; producción 90 días, según opciones disponibles. Vercel contempla excepciones por alias y deployments recientes; revisar la lista antes de aplicar. No es una medida de recuperación de cuota. [Retención](https://vercel.com/docs/deployment-retention).

## 4. Comprobar producción y caché sin generar carga

### Controles de mantenimiento en Runtime

La sección de `/admin/runtime` revisa deployments de producción, sin consultar Vercel automáticamente ni hacer polling. No revisa previews: Git no despliega nada (ver [Deploys](#deploys)). Cada clic revisa una página de hasta 10 deployments y ofrece seguir con los anteriores. Solo muestra candidatos con más de 90 días, en estado READY, ERROR o CANCELED.

Se conservan los tres deployments más recientes, las tres últimas versiones READY de producción, el destino de producción actual, la instancia que ejecuta la acción y cualquier deployment con alias asignado. Entornos personalizados y estados desconocidos quedan excluidos. El borrado es individual, muestra la URL para confirmar y vuelve a consultar proyecto, estado, fecha, versiones protegidas y alias en el servidor. No promover ni reasignar aliases mientras se elimina: Vercel no ofrece en este flujo una operación atómica de comprobar protecciones y borrar.

Para habilitarlo, configurar en el servidor:

- `MAINTENANCE_VERCEL_TOKEN`: token de una cuenta con acceso al equipo, con el menor alcance disponible y vencimiento definido. Nunca `NEXT_PUBLIC` ni en el navegador.
- `MAINTENANCE_VERCEL_PROJECT_ID`: ID `prj_…` del proyecto a mantener.
- `MAINTENANCE_VERCEL_TEAM_ID`: ID `team_…` del equipo propietario.

Usar exclusivamente el entorno de administración de confianza; no exponer esta credencial en previews de código no revisado. El token del conector de Codex no configura estas variables. Un 403 requiere revisar permisos, no quitar las protecciones. La implementación se verificó con respuestas simuladas; aún requiere configurar credenciales y comprobar lectura real antes de usarla contra la cuenta.

`GET /api/admin/runtime/maintenance` requiere ADMIN. El POST además verifica Origin, valida la acción y registra una auditoría `RUNTIME_MAINTENANCE` con usuario, acción e ID, incluso si el logging normal está apagado. Si no puede registrar el inicio, no ejecuta la acción. Un timeout o fallo posterior puede dejar un resultado incierto: comprobar el proveedor antes de reintentar. La consulta y las respuestas no exponen tokens ni errores crudos del proveedor.

El botón **Limpiar logs vencidos** reutiliza la retención existente (ABUSE: 7 días; resto: 90), con presupuesto de 10 segundos y resultado parcial explícito. No dispara ingesta, noticias ni auditoría de videos. El aviso de R2 solo comprueba presencia de variables, no credenciales ni referencias antiguas. Los interruptores de emergencia anteriores guardan estado en memoria por instancia: no asumir que detienen globalmente Vercel. Estas acciones no recuperan cuota de transferencia o CPU consumida.

Pruebas: `node scripts/test-runtime-maintenance.mjs` (permisos, origen, proyecto, estados, antigüedad, alias, rollback, promoción posterior a revisión, auditoría y paginación) y `node scripts/test-runtime-maintenance-ui.mjs` (confirmar/cancelar, ausencia de consultas automáticas, fallos, configuración faltante y móvil). No borran recursos reales ni consultan la base de producción.

### Verificación pública

```powershell
curl.exe -sS --max-time 20 https://mundobl.com.ar/api/build-info

# Dos GET anónimos de la misma URL, sin parámetros de cache-busting.
curl.exe -sS -D - -o NUL --max-time 20 https://mundobl.com.ar/ver/676
curl.exe -sS -D - -o NUL --max-time 20 https://mundobl.com.ar/ver/676
```

En Vercel observar `X-Vercel-Cache: HIT` y `Age`. Un MISS aislado puede ser calentamiento; MISS persistentes requieren revisar la ruta. `Cache-Control: public, max-age=0, must-revalidate` visto por el navegador no demuestra ausencia de caché CDN. En `next start` local puede aparecer `x-nextjs-cache`. No extrapolar las pruebas anónimas a datos privados: perfil, sesión y progreso necesitan aislamiento por usuario.

Antes de desplegar cambios de caché, verificar con PostgreSQL local y la documentación instalada de Next.js. Para una edición solo documental no hace falta hacer build ni consultar producción masivamente. `robots.txt` orienta crawlers cooperativos; no impide el acceso de bots que lo ignoran. Elegir reglas de firewall a partir de tráfico observado y verificar que no bloqueen usuarios ni integraciones.

## 5. Supabase: diagnóstico de espacio e imágenes

En SQL Editor, consultas de diagnóstico de solo lectura; no sustituyen Usage para límites o promedios:

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

SELECT bucket_id, count(*) AS objects,
       round(sum((metadata->>'size')::numeric) / 1048576, 2) AS size_mb
FROM storage.objects
GROUP BY bucket_id
ORDER BY size_mb DESC;
```

La app usa Prisma para datos; el cliente Supabase se usa para Storage. `src/lib/supabase.ts` sube a R2 cuando están presentes las cinco variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_HOST`. Si falta alguna, la subida falla con un error que las nombra: ya no cae a Supabase. Para cargar series o correr scripts desde local, el `.env` necesita las cinco.

Existe `scripts/migrate-images-to-r2.ts`, con fases `copy --dry-run`, `copy`, `verify`, `rewrite --dry-run`, `rewrite`. Antes de ejecutarlo, revisar conexión destino y autenticación de Wrangler. `copy` transfiere archivos y consume egress; `rewrite` modifica URLs en la base. No ejecutar ambas fases a ciegas para ahorrar cuota.

Limitaciones actuales del script: cubre `Series.imageUrl` e `imageThumbUrl`, no todos los tipos de imágenes; `verify` comprueba disponibilidad por HEAD, no identidad de bytes. Revisar **Fallidas: 0** y **Faltantes: 0** antes de reescribir: no confiar únicamente en el exit code. Verificar muestras visuales y tamaños, conservar el mapeo previo para revertir URLs y revalidar las páginas afectadas mediante el flujo de la app; el script no invalida la caché por sí mismo.

No borrar el bucket Supabase después de copiar: primero comprobar referencias en tablas, contenido enriquecido, cachés y versiones conservadas. Borrar objetos por API/gestor de Storage, no borrando filas de `storage.objects`. Un `DELETE` de datos PostgreSQL tampoco implica reducción inmediata del archivo de base; no aplicar `VACUUM FULL` sin evaluar bloqueos y espacio disponible.

La limpieza normal de `AccessLog` ya tiene retención de 7 días para ABUSE y 90 días para el resto en `src/lib/access-log.ts`. Verificar la ejecución del cron antes de inventar una purga manual. No borrar sesiones, usuarios, progreso o historial para resolver una cuota sin diagnóstico y respaldo.

## 6. Backups, restauración y tareas programadas

Procedimiento detallado: [Backup y recuperación](backups.md). El respaldo JSON de aplicación se almacena en el bucket privado `mundobl-backups`; no incluye imágenes ni configuración externa. El workflow solo corre si `BACKUPS_ENABLED=true` y los secrets existen.

Verificar una ejecución **exitosa, no omitida**, el objeto reciente en R2, tamaño no nulo y un ensayo de restauración local. Una programación en Git no demuestra que haya copias. El backup semanal implica una pérdida potencial de aproximadamente siete días desde la última copia válida; una falla puede extenderla. Acordar esa tolerancia antes de reducir frecuencia por costos. Con retención de 14 días quedan pocas copias semanales.

```powershell
# Requiere GitHub CLI autenticado. Solo consulta estado.
gh run list --repo juanjparedez/mundobl --workflow backup.yml --limit 5
gh variable get BACKUPS_ENABLED --repo juanjparedez/mundobl

# Cobertura local de modelos; no hace un dump de producción.
npx tsx scripts/backup-db.ts --check-models
```

Comprimir en GitHub después de extraer la base reduce el tamaño guardado en R2; no reduce los bytes que ya salieron de Supabase hacia GitHub. No usar el tamaño `.gz` como estimación directa de egress del dump.

El cron de aplicación `/api/cron/daily` es independiente del backup semanal: ejecuta tareas de contenido y limpieza. Revisar su última corrida desde Runtime/admin y logs; no invocarlo repetidamente como comprobación de salud. Ver [tareas de runtime](runtime-jobs.md).

Las migraciones de Prisma también son independientes del indicador de migraciones del panel Supabase. Revisar `npx prisma migrate status` y `npm run db:check` con la conexión correcta. Crear migraciones solo contra PostgreSQL local; aplicar cambios aprobados con `npm run migrate:supabase`, según [context.md](../context.md). Nunca usar reset o db push contra producción para mantenimiento.

## 7. Rutina y recuperación

| Frecuencia / evento         | Trabajo                                                                            | Evidencia de cierre                                |
| --------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Diaria mientras hay alerta  | Usage de ambos proveedores, pendientes de restricción, incremento y margen         | Valores y período anotados; causa identificada     |
| Después de desplegar        | Commit servido, muestra pequeña de páginas/caché, errores                          | SHA correcto, HTTP esperado, HIT donde corresponde |
| Semanal, después del backup | Workflow, objeto R2, cron de aplicación, crecimiento de DB/Storage                 | Copia válida reciente y jobs sin fallas pendientes |
| Mensual                     | Revisar retención de deployments, objetos huérfanos y prueba de restauración local | Candidatos revisados y restauración comprobada     |
| Antes de borrar o migrar    | Confirmar destino, respaldo y procedimiento de reversión                           | Inventario concreto de recursos afectados          |

Ante una caída: registrar hora/errores, consultar estado del proveedor y Usage, distinguir cuota agotada de error de aplicación. Un rollback de código no soluciona cuota agotada ni revierte migraciones. Conservar datos y evitar redeploys repetidos. Si el proveedor confirma restricción, usar su procedimiento de recuperación; si es regresión, seleccionar una versión compatible con el esquema actual. Verificar login, lectura y guardado de progreso con una cuenta de prueba después de recuperar.

### Pendientes para cerrar este incidente

- Obtener usados/límites y fechas de Supabase y Vercel, y medir la tasa posterior a #107.
- Verificar la última copia externa válida y una restauración; el panel compartido no lo acredita.
- Migrar a R2 las 20 series y las 12 imágenes de pedidos que siguen en Supabase (medido el 28/09), y comprobar configuración R2 en los entornos que suben archivos.
- Decidir continuidad en Free/Hobby con esos datos. La caché comprobada es una mitigación, no una garantía de disponibilidad dentro de cuota.
