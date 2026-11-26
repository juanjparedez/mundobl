# Manual de mantenimiento de MundoBL

Revisión: 10/11/2026. Aplicación: `mundobl.com.ar`, en Cloudflare Workers Paid
(USD 5 por mes) desde el 10/11/2026. La base es la D1 `mundobl` y las
imágenes están en R2. Instalación, deploy y configuración del panel de Cloudflare:
[deploy-cloudflare.md](deploy-cloudflare.md).

## 1. Qué se paga y qué puede cobrar extra

| Servicio                     | Incluido                                                    | Qué lo haría pasar                                |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| Workers requests             | 10 millones por mes                                         | Bots o un ataque. Los estáticos no cuentan.       |
| Workers CPU                  | 30 millones de ms por mes (la espera a la base no cuenta)   | Páginas pesadas sin caché, crawls masivos.        |
| Logs del Worker (desde 1/12) | 50 GB de ingesta y 10 GB-mes de almacenamiento              | Muchísimos `console.log` por request.             |
| Rate limiting                | Sin costo por uso                                           | Nada.                                             |
| D1                           | 25.000 M filas leídas, 50 M escritas por mes, 5 GB          | Consultas sin índice que recorren tablas enteras. |
| R2                           | 10 GB, 1 millón de escrituras y 10 millones de lecturas/mes | Subidas masivas. El egress de R2 es gratis.       |
| Durable Objects              | Incluidos en el plan                                        | Revalidaciones en loop.                           |

Workers no tiene tope de gasto. Las alertas de costo se configuran una vez
(deploy-cloudflare.md, "Alertas de costo"). Uso del mes: Cloudflare →
**Manage Account** → **Billing** → **Billable Usage**.

## 2. Qué hacer ante una alerta

1. Anotar el mensaje completo, la fecha, usado/límite y el período.
2. Cloudflare → Workers & Pages → mundobl → **Metrics**: ver si subieron los
   requests o el CPU por request. Security → **Events**: ver si hay un bot
   nuevo. Si un bot ignora robots.txt, bloquearlo con una regla de Security
   rules (por user agent o ASN), nunca a Googlebot ni Bingbot.
3. Cloudflare → Storage & Databases → D1 → mundobl → **Metrics**: filas
   leídas y escritas, tamaño.
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

## 4. Base D1: espacio e imágenes

Tamaño y tablas más grandes (solo lectura):

```powershell
npx wrangler d1 info mundobl
npx wrangler d1 execute mundobl --remote --command "SELECT name, SUM(pgsize)/1048576.0 AS mb FROM dbstat GROUP BY name ORDER BY mb DESC LIMIT 20"
```

Las imágenes nuevas se suben a R2 (`src/lib/supabase.ts`, pese al nombre).
Necesita las cinco variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_HOST`; si falta alguna, la subida
falla nombrándola. Algunas imágenes viejas todavía tienen URL de Supabase Storage:
`scripts/migrate-images-to-r2.ts` (`copy --dry-run`, `copy`, `verify`,
`rewrite --dry-run`, `rewrite`) las copia a R2 y reescribe las URLs. Revisar
**Fallidas: 0** y **Faltantes: 0** antes de `rewrite`. No borrar el proyecto de
Supabase hasta que ninguna fila apunte a su Storage.

La limpieza normal de `AccessLog` ya tiene retención de 7 días para ABUSE y 90 días para el resto en `src/lib/access-log.ts`. Verificar la ejecución del cron antes de inventar una purga manual. No borrar sesiones, usuarios, progreso o historial para resolver una cuota sin diagnóstico y respaldo.

## 5. Backups, restauración y tareas programadas

Procedimiento detallado: [Backup y recuperación](backups.md). El volcado SQL de la D1 se almacena en el bucket privado `mundobl-backups`; no incluye imágenes ni configuración externa. El workflow solo corre si `BACKUPS_ENABLED=true` y los secrets existen.

Verificar una ejecución **exitosa, no omitida**, el objeto reciente en R2, tamaño no nulo y un ensayo de restauración local. Una programación en Git no demuestra que haya copias. El backup semanal implica una pérdida potencial de aproximadamente siete días desde la última copia válida; una falla puede extenderla. Acordar esa tolerancia antes de reducir frecuencia por costos. Con retención de 14 días quedan pocas copias semanales.

```powershell
# Requiere GitHub CLI autenticado. Solo consulta estado.
gh run list --repo juanjparedez/mundobl --workflow backup.yml --limit 5
gh variable get BACKUPS_ENABLED --repo juanjparedez/mundobl
```

Además del backup semanal, D1 guarda 30 días de Time Travel (ver backups.md).

El cron de aplicación `/api/cron/daily` es independiente del backup semanal: ejecuta tareas de contenido y limpieza. Revisar su última corrida desde /admin/runtime y en Cloudflare → Workers & Pages → mundobl → Logs (filtro `[cron]`); no invocarlo repetidamente como comprobación de salud.

Migraciones: `npm run db:migration <nombre>` genera el SQL en `migrations/` y `npm run db:check` verifica que coincide con el schema. El deploy las aplica solo; a mano, `npm run migrate:d1`. Los comandos `prisma migrate` y `db push` están bloqueados (`scripts/prisma-safety.ts`).

## 6. Rutina y recuperación

| Frecuencia / evento         | Trabajo                                                                          | Evidencia de cierre                                |
| --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- |
| Diaria mientras hay alerta  | Usage de ambos proveedores, pendientes de restricción, incremento y margen       | Valores y período anotados; causa identificada     |
| Después de desplegar        | Commit servido, resumen del deploy (migraciones D1), muestra de páginas, errores | SHA correcto, HTTP esperado, sin errores nuevos    |
| Semanal, después del backup | Workflow, objeto R2, cron de aplicación, crecimiento de DB/Storage               | Copia válida reciente y jobs sin fallas pendientes |
| Mensual                     | Billable Usage de Cloudflare, objetos huérfanos y prueba de restauración local   | Uso dentro del plan y restauración comprobada      |
| Antes de borrar o migrar    | Confirmar destino, respaldo y procedimiento de reversión                         | Inventario concreto de recursos afectados          |

Ante una caída: registrar hora/errores, consultar estado del proveedor y Usage, distinguir cuota agotada de error de aplicación. Un rollback de código no soluciona cuota agotada ni revierte migraciones. Conservar datos y evitar redeploys repetidos. Si el proveedor confirma restricción, usar su procedimiento de recuperación; si es regresión, seleccionar una versión compatible con el esquema actual. Verificar login, lectura y guardado de progreso con una cuenta de prueba después de recuperar.
