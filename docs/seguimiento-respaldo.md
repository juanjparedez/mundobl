# Respaldo de seguimiento y notas privadas

La exportación de cuenta incluye el progreso de series, temporadas y episodios, y las notas privadas de series y episodios. Se descarga desde la configuración del perfil. El archivo contiene información personal; el flujo de restauración no utiliza IA ni publica las notas como comentarios.

## Formato

Se mantiene `schemaVersion: 1`. Los respaldos anteriores, sin las secciones de notas, siguen siendo válidos. Cada estado debe identificar exactamente una entidad; los otros identificadores pueden faltar o ser `null`.

Ejemplo ilustrativo, con identificadores que deben corresponder a registros existentes en la misma instalación:

```json
{
  "schemaVersion": 1,
  "viewStatuses": [
    {
      "seriesId": 12,
      "status": "VIENDO",
      "watchedDate": null,
      "lastWatchedAt": "2026-09-20T20:30:00.000Z"
    },
    {
      "episodeId": 84,
      "status": "VISTA",
      "watchedDate": "2026-09-20",
      "lastWatchedAt": null
    }
  ],
  "seriesNotes": [
    { "seriesId": 12, "body": "Mi nota privada sobre la serie." }
  ],
  "episodeNotes": [
    {
      "episodeId": 84,
      "body": "Mi reacción a este capítulo.",
      "createdAt": "2026-09-20T20:31:00.000Z",
      "updatedAt": "2026-09-20T20:31:00.000Z"
    }
  ]
}
```

Estados admitidos: `SIN_VER`, `VIENDO`, `VISTA`, `ABANDONADA`, `RETOMAR`. Las notas admiten hasta 5000 caracteres. Las fechas aceptan el formato UTC exportado o `YYYY-MM-DD`; una fecha desconocida de visionado se conserva como `null`, sin asignar hoy. Las fechas de creación/edición de notas se preservan cuando existen; si faltan se usan los valores por defecto de la base.

## Restauración

La interfaz consulta primero `POST /api/user/account/import?dryRun=true`, autenticado con la cuenta actual, y permite confirmar con `dryRun=false`. El tamaño máximo del JSON es 5 MB; se verifica también sobre el cuerpo recibido, no solo su cabecera.

Para seguimiento y notas, la vista previa valida referencias y descuenta registros ya existentes o repetidos en el archivo. Un registro tiene prioridad si ya está en la cuenta; entre duplicados nuevos del mismo archivo gana el primero válido. La aplicación vuelve a comprobar duplicados al insertar, por lo que el resultado puede diferir si la cuenta cambió desde la vista previa.

Seguimiento y notas se escriben en una transacción. No se modifica la ficha editorial ni se crean series. Los campos `userId` e `id` del archivo no otorgan identidad ni permisos: la propiedad siempre procede de la sesión autenticada. Las notas se guardan únicamente en las tablas privadas.

## Límites actuales

- Restaurar combina datos: no corrige ni reemplaza un estado o nota ya existente. La edición masiva revisable es un flujo pendiente.
- Los identificadores no son portables entre instalaciones con catálogos distintos. No hay todavía coincidencia por títulos o referencias externas.
- No se sintetizan agregados de serie a partir de un archivo que solo contiene estados de episodio. El respaldo exportado contiene los estados guardados de cada nivel.
- No existe aún un historial de múltiples visionados; no se puede restaurar información que el modelo no conserva.
- Las demás secciones del importador mantienen su comportamiento anterior; esta mejora no garantiza una restauración integral de toda la cuenta ni atomicidad entre todas las secciones.
- La importación de texto libre, CSV y propuestas de IA queda pendiente.

## Verificación

`npx tsx scripts/test-tracking-backup.ts` prueba planificación de exportación/restauración, identidad de la cuenta, conservación de fechas, reintentos, duplicados, referencias inexistentes y entradas inválidas con datos sintéticos, sin conexión a una base. TypeScript y ESLint cubren las rutas y la integración del helper.

También se ejecutó `test-tracking-database.ts` con SQL real sobre PGlite local: vista previa sin escrituras, propiedad de la cuenta, conservación de fechas, reintentos y prioridad de los datos existentes. Ver `seguimiento-pruebas-locales.md` para reproducirlo y conocer sus límites. La prueba de fallo deliberado/rollback, la concurrencia en PostgreSQL nativo y el recorrido HTTP autenticado completo siguen pendientes.

### Historial de cambios

El export personal incluye `trackingEvents`. Cada evento conserva su ID, estado anterior/nuevo y fechas conocidas o desconocidas. La restauración asigna siempre la cuenta autenticada y deduplica IDs dentro de esa cuenta. Una sección explícita, incluso vacía, suprime la captura automática durante la restauración para no inventar eventos; archivos antiguos sin esta sección siguen siendo compatibles. El historial se puede borrar sin quitar progreso ni notas. Estos eventos no representan vueltas de visionado.

### Corregir fechas sin reimportar

Con sesión iniciada, `PATCH /api/user/watch-date` recibe, por ejemplo:

```json
{"episodeId":123,"watchedDate":"2024-06-15","expectedDate":"2024-06-16T14:30:00.000Z"}
```

Usar la fecha previa exacta de la exportación como expectedDate; null indica que era desconocida. watchedDate null vuelve a dejarla desconocida. Solo se corrigen marcas VISTA de tu cuenta. Un 409 indica que el registro cambió, no existe o ya no está visto: actualizar el dato antes de intentar de nuevo. No crea contenido ni modifica el progreso; queda constancia en el historial privado. Las fechas elegidas son días UTC. La interfaz de edición aún está pendiente.
