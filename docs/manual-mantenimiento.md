# Manual de mantenimiento de MundoBL

Revisión: 10/11/2026. Aplicación: `mundobl.com.ar`, en Cloudflare Workers Paid
(USD 5 por mes) desde el 10/11/2026. La base está en Supabase Free y las
imágenes en R2. Instalación, deploy y configuración del panel de Cloudflare:
[deploy-cloudflare.md](deploy-cloudflare.md).

## 1. Qué se paga y qué puede cobrar extra

| Servicio                     | Incluido                                                    | Qué lo haría pasar                                                  |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Workers requests             | 10 millones por mes                                         | Bots o un ataque. Los estáticos no cuentan.                         |
| Workers CPU                  | 30 millones de ms por mes (la espera a la base no cuenta)   | Páginas pesadas sin caché, crawls masivos.                          |
| Logs del Worker (desde 1/12) | 50 GB de ingesta y 10 GB-mes de almacenamiento              | Muchísimos `console.log` por request.                               |
| Hyperdrive, rate limiting    | Sin costo por uso                                           | Nada.                                                               |
| R2                           | 10 GB, 1 millón de escrituras y 10 millones de lecturas/mes | Subidas masivas. El egress de R2 es gratis.                         |
| Durable Objects              | Incluidos en el plan                                        | Revalidaciones en loop.                                             |
| Supabase Free                | 5 GB de egress, 500 MB de base, 1 GB de Storage             | Dumps repetidos, consultas que traen tablas enteras. Ver sección 4. |

Workers no tiene tope de gasto. Las alertas de costo se configuran una vez
(deploy-cloudflare.md, "Alertas de costo"). Uso del mes: Cloudflare →
**Manage Account** → **Billing** → **Billable Usage**.

## 2. Qué hacer ante una alerta

1. Anotar el mensaje completo, la fecha, usado/límite y el período.
2. Cloudflare → Workers & Pages → mundobl → **Metrics**: ver si subieron los
   requests o el CPU por request. Security → **Events**: ver si hay un bot
   nuevo. Si un bot ignora robots.txt, bloquearlo con una regla de Security
   rules (por user agent o ASN), nunca a Googlebot ni Bingbot.
3. Supabase → Usage: revisar Egress y Database Size por separado.
4. Registrar una segunda medición a las 24 h. Ante un bloqueo real, actuar
   sin esperar.

## 3. Comprobar producción

```powershell
curl.exe -sS --max-time 20 https://mundobl.com.ar/api/build-info
curl.exe -sS -D - -o NUL --max-time 20 https://mundobl.com.ar/ver/676
curl.exe -sS -D - -o NUL --max-time 20 https://www.mundobl.com.ar/
```

El primero devuelve el commit servido. El segundo tiene que dar 200. El
tercero tiene que dar 301 a `https://mundobl.com.ar/`.

`robots.txt` orienta a los crawlers que cooperan; no frena a los que lo
ignoran. Para esos están las reglas del panel y el rate limiting del Worker.

## 4. Supabase: diagnóstico de espacio e imágenes

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

## 5. Backups, restauración y tareas programadas

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

El cron de aplicación `/api/cron/daily` es independiente del backup semanal: ejecuta tareas de contenido y limpieza. Revisar su última corrida desde /admin/runtime y en Cloudflare → Workers & Pages → mundobl → Logs (filtro `[cron]`); no invocarlo repetidamente como comprobación de salud.

Las migraciones de Prisma también son independientes del indicador de migraciones del panel Supabase. Revisar `npx prisma migrate status` y `npm run db:check` con la conexión correcta. Crear migraciones solo contra PostgreSQL local; aplicar cambios aprobados con `npm run migrate:supabase`, según [context.md](ai-context/context.md). Nunca usar reset o db push contra producción para mantenimiento.

## 6. Rutina y recuperación

| Frecuencia / evento         | Trabajo                                                                        | Evidencia de cierre                                |
| --------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Diaria mientras hay alerta  | Usage de ambos proveedores, pendientes de restricción, incremento y margen     | Valores y período anotados; causa identificada     |
| Después de desplegar        | Commit servido, resumen del deploy (Hyperdrive), muestra de páginas, errores   | SHA correcto, HTTP esperado, sin errores nuevos    |
| Semanal, después del backup | Workflow, objeto R2, cron de aplicación, crecimiento de DB/Storage             | Copia válida reciente y jobs sin fallas pendientes |
| Mensual                     | Billable Usage de Cloudflare, objetos huérfanos y prueba de restauración local | Uso dentro del plan y restauración comprobada      |
| Antes de borrar o migrar    | Confirmar destino, respaldo y procedimiento de reversión                       | Inventario concreto de recursos afectados          |

Ante una caída: registrar hora/errores, consultar estado del proveedor y Usage, distinguir cuota agotada de error de aplicación. Un rollback de código no soluciona cuota agotada ni revierte migraciones. Conservar datos y evitar redeploys repetidos. Si el proveedor confirma restricción, usar su procedimiento de recuperación; si es regresión, seleccionar una versión compatible con el esquema actual. Verificar login, lectura y guardado de progreso con una cuenta de prueba después de recuperar.
