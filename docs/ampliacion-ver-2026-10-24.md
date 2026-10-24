# Ampliación local de /ver — 24/10/2026

## Entrega autorizada

El propietario autorizó publicar este lote completo tras repetir la verificación. La nueva comprobación de las **13:36 ART / 16:36 UTC** dio OK para los 114 videos YouTube y el corto Vimeo, tanto en API como en página anónima/oEmbed. Producción tiene las variables YouTube y Vimeo necesarias; Dailymotion no se activa.

`scripts/publish-ver-content-batch.ts` mantiene el ensayo local separado de la operación de producción. Requiere `DATABASE_URL`, `YOUTUBE_API_KEY` y `VIMEO_ACCESS_TOKEN` proporcionadas explícitamente. Solo admite el proyecto Supabase de MundoBL. La simulación usa una transacción de solo lectura; --apply exige el plan resultante y comprueba que no cambiaron el manifiesto, la evidencia ni las fichas destino. Se vuelven a verificar las APIs y se exige evidencia anónima completa de menos de una hora, evitando repetir innecesariamente las 114 páginas. Cada ejecución conserva evidencia en `backups/ver-release-*`, fuera de Git.

```powershell
node --env-file=.env --import tsx scripts/publish-ver-content-batch.ts --evidence=test-results/ver-expansion/playback-2026-10-24T16-36-51-321Z.json
# Después de revisar el plan y con CI aprobado:
node --env-file=.env --import tsx scripts/publish-ver-content-batch.ts --evidence=test-results/ver-expansion/playback-2026-10-24T16-36-51-321Z.json --plan=backups/ver-release-FECHA/plan.json --apply
```

La aplicación registra revisiones y preserva episodios/seguimiento; no envía notificaciones ni correos. Después se despliega una sola vez mediante el workflow existente y se verifica el listado, los detalles, el SHA y Vimeo. La documentación siguiente conserva el diagnóstico y las limitaciones del ensayo anterior.

## Diagnóstico comprobado

- Consulta remota de solo lectura, forzada mediante `default_transaction_read_only`: 777 fichas, 29 con algún embed, 27 que pasan el filtro de duración de `/ver`. De esas 27, 26 tenían algún video reproducible en AR según el estado guardado; no se volvió a auditar todo el catálogo.
- `YOUTUBE_API_KEY` local funciona. No se verificó la variable de Vercel ni se cambió configuración remota.
- El barrido y el importador ya existen. Agregar una productora como metadata no habilita sus episodios: el guarda comprueba el ID real del canal contra `src/lib/official-channels.ts`.
- Se agregaron cinco fuentes nuevas para el sitio: GND STUDIO, Rookie Thailand, Mind Trio, Sukfilm y Wayufilm Production. Identidades contrastadas con sus canales y la Data API. No se afirma que sean empresas recién creadas.
- La integración local ahora admite YouTube y Vimeo oficiales; Dailymotion queda preparado pero pendiente de Player ID y de obras verificadas. No se encontró una integración pública acreditada para insertar directamente el catálogo completo de Viki, GagaOOLala o iQIYI. Sus links externos y sus publicaciones oficiales en YouTube son caminos distintos.

## Lote seleccionado

El manifiesto `scripts/data/ver-content-2026-10-24.json` contiene IDs exactos, numeración editorial, partes, fecha de publicación y título original como evidencia. No importa automáticamente todos los elementos de una playlist.

| Ficha | Capítulos | Videos | Fuente |
| --- | ---: | ---: | --- |
| 611 — My damn business | 7 | 7 | [GND](https://www.youtube.com/playlist?list=PL-UjFgW8TJEcVMXRV63uoHXg7rXv7mwll) |
| 502 — Love in protocol | 4 | 4 | [GND](https://www.youtube.com/playlist?list=PL-UjFgW8TJEfcBaYLr8jyN_Dn00ScQ6CW) |
| 76 — Blue boys | 4 | 4 | [Sukfilm, EP1–4](https://www.youtube.com/playlist?list=PLYfaogVGCvwTczUW4K1YELu_cWQfUQ21a) |
| 77 — Blue boys 2 | 4 | 4 | [Sukfilm, EP5–8](https://www.youtube.com/playlist?list=PLYfaogVGCvwTczUW4K1YELu_cWQfUQ21a) |
| 198 — First note of love | 12 | 12 | [GagaOOLala](https://www.youtube.com/playlist?list=PL-NRJVNnoKievO009xKPNKIM93g2Z3GGY) |
| Nueva — The Best Story | 3 | 6 | [Rookie](https://www.youtube.com/playlist?list=PLUTllkCvL25gr75IzPcKrHtH57UmCoQTG) |
| Nueva — 21 Days Theory | 4 | 8 | [Rookie](https://www.youtube.com/playlist?list=PLUTllkCvL25jAHOPCJo_TphtVWkWcyfR3) |
| Nueva — On Cloud Nine | 6 | 6 | [Mind Trio](https://www.youtube.com/playlist?list=PLHWvrNIJL6cWZ-doJDFK2VMshJFRfvz5H) |
| **Total** | **44** | **51** | **8 fichas** |

Los 51 videos pasaron canal oficial, duración ≥300 segundos, disponibilidad en los siete mercados core y página anónima de YouTube con `playabilityStatus=OK`. Esta comprobación no equivale a ver completos los 51 videos ni garantiza subtítulos en español. First Note of Love tiene restricción declarada para JP/KR. La disponibilidad puede cambiar.

Se excluyó **The Star**: la API decía público/embebible, pero su página exigía membresía Business Class. La fila creada durante la primera simulación se retiró exclusivamente de la base local. Wayufilm sigue reconocido como canal oficial; eso no hace gratuitos todos sus videos. También se descartaron playlists incompletas o promocionales de Viu, WeTV y GagaOOLala.

## Segundo lote y otras plataformas

Los manifiestos adicionales son `scripts/data/ver-content-youtube-expanded-2026-10-24.json` y `scripts/data/ver-content-vimeo-2026-10-24.json`.

| Ficha | Capítulos/videos | Fuente |
| --- | ---: | --- |
| Nueva — Love Bill | 10 | O2, YouTube |
| 592 — Mr. Cinderella | 8 | O2, YouTube |
| Nueva — Mr. Cinderella 2 | 8 | O2, YouTube |
| Nueva — Be Your Star | 20 | O2, YouTube |
| Nueva — VIAN | 12 | O2, YouTube |
| 233 — Happy Ending | 3 | Strongberry, YouTube |
| 16 — A First Love Story | 2 | Strongberry, YouTube |
| Nueva — Yu and Rachel (2014, Taiwán) | 1 | WU ZI-EN, Vimeo |

El lote combinado contiene **16 títulos, 108 capítulos y 115 videos**: 15 títulos de YouTube y uno de Vimeo. Love Bill usa el EP3 oficial alternativo sin restricción de edad; VIAN conserva el final original. Want to See You se excluyó por membresía en su EP14.

Vimeo verifica el propietario 7732934 y la obra 129009162 contra `official-video-publishers.ts`; no habilita automáticamente todo el catálogo de un usuario. La API confirma disponibilidad, privacidad pública, inserción pública y 733 segundos; oEmbed se consulta sin credenciales. El corto reprodujo dentro de `/ver/815-yu-and-rachel` en Chrome local, con avance visible del reproductor; no se certifica visualización completa ni subtítulos españoles.

`episode-platforms.ts` valida host, formato de ID y URL canónica. `external-episode-source.ts` consulta solo endpoints fijos, con timeout y sin redirecciones. Preview, confirmación y administración comparten el guarda. Al cambiar proveedor se limpian contadores de YouTube. El audit procesa Vimeo/Dailymotion y conserva el último resultado ante fallos temporales; los cambios invalidan las fichas y listados correspondientes.

La interfaz usa **suscribirse** para YouTube, **seguir** para Vimeo/Dailymotion, **avisos de MundoBL** para la campanita y el nombre real del proveedor en enlaces y avisos. Las reproducciones y los me gusta de YouTube solo suman videos de YouTube. Se actualizaron los diez locales. Progreso manual para todos; detección automática de tiempo visto solo para YouTube.

Dailymotion necesita `NEXT_PUBLIC_DAILYMOTION_PLAYER_ID` al compilar. `x6gs386` es el ID de la cuenta, no del reproductor; el panel inspeccionado ofrece Medios/Análisis/Ganancias pero no Embeds/Players. No se cambió ningún plan. Adaptador validado con fixtures; sin reproducción real de Dailymotion ni títulos importados de esa plataforma. Vimeo reutiliza `VIMEO_ACCESS_TOKEN` solo en servidor; no se modificaron variables de producción.

## Reproducir y revisar localmente

La herramienta **no acepta una base remota** y no carga `DATABASE_URL` desde `.env`. Solo lee las credenciales existentes de YouTube y Vimeo si no están exportadas. Cada ejecución vuelve a verificar los 114 videos de YouTube por API y página pública, y el video de Vimeo por API y oEmbed. Si falla una comprobación o hay membresía, bloqueo o conflicto, aborta antes de persistir. Una respuesta desconocida detiene las consultas de páginas; cada comprobación conserva un archivo con timestamp.

```powershell
$env:DATABASE_URL='postgresql://mundobl@127.0.0.1:55433/mundobl_ver_expansion'
npx tsx scripts/import-ver-content-batch.ts          # Simular, sin escrituras
npx tsx scripts/import-ver-content-batch.ts --apply  # Aplicar solo local
npx tsx scripts/test-watch-content-batch.ts
```

Requiere esquema migrado, países y las ocho fichas destino con sus IDs/títulos esperados. Se usó una base separada `mundobl_ver_expansion` con copia de metadata pública; no es una copia de cuentas ni actividad personal. Las ocho altas usan `WATCHABLE_ONLY`, portada del proveedor y clasificación por defecto `UNREVIEWED`. No se cambian reseñas, clasificación ni ámbito de las fichas existentes.

`src/lib/watch-content-batch.ts` trabaja en una transacción serializable desde el CLI. Conserva IDs y seguimiento de episodios existentes, rechaza sobrescribir embeds diferentes, detecta videos en otra serie, registra la foto previa en `SeriesRevision` e incrementa `editVersion`. Los videos partidos se aceptan sobre temporadas nuevas; no renumera capítulos ya seguidos. Repetir el lote es un no-op. No envía notificaciones, correos ni sube imágenes.

Resultados locales: **785 fichas, 43 títulos en `/ver`** frente a 777/27 de la línea de base. Los ocho iniciales ya estaban aplicados en el ensayo anterior. La simulación combinada fue satisfactoria a las 08:01 UTC. Al repetir la verificación para aplicar, YouTube respondió 429 y la receta abortó sin escribir. Para completar exclusivamente el ensayo local de los ocho adicionales se usó la evidencia positiva guardada a las 07:43 UTC (menos de una hora de antigüedad), junto con nuevas consultas API y Vimeo; no se sustituyó un resultado desconocido por uno exitoso ni se sorteó el límite. La receta publicable sigue exigiendo comprobación en vivo.

Evidencia en `test-results/ver-expansion/`: `expanded-rehearsal-applied.json`, `expanded-verified.json`, `rehearsal-playback-verification.json`, `expanded-preview.log`, `expanded-applied.log` y los artefactos del primer lote. Antes de cualquier publicación deberá repetirse la comprobación anónima cuando YouTube vuelva a permitirla. Los IDs 811–815 son exclusivos del ensayo local.

## Validación y siguiente entrega

- Regresión de datos: simulación sin escritura, IDs/seguimiento, partes, revisión/versionado, repetición, conflicto, rollback; rechazo de canal no verificado, trailer, bloqueo, página inaccesible y membresía aunque la API diga OK.
- `npm run test:fast`: aprobado, ocho warnings existentes fuera de este cambio. TypeScript se volvió a comprobar tras el ajuste del control de membresía.
- Build Next.js con variables externas vaciadas y DB local: aprobado. Sin migración de schema; nuevas cadenas y cambios de terminología incluidos en diez idiomas.
- Consulta del listado y los 16 detalles: 108 capítulos, sin extras y 115 videos seleccionados. Vimeo conserva contadores YouTube nulos.
- Primer lote en navegador: ocho detalles 200, The Best Story avanza de parte 1/2 a 2/2; revisión a 1280 y 390 px sin desborde horizontal. Ampliación: reproducción real del corto de Vimeo dentro de MundoBL local y atribución a su director. No se afirma haber reproducido completos todos los videos.
- Regresión de proveedores: identidad de URL/propietario, duración, privacidad, oEmbed, errores temporales, configuración Dailymotion, limpieza de contadores al resolver un embed y permisos de aportes. Dailymotion usa fixtures, no una cuenta configurada.

**Nada publicado:** no se escribió producción ni se hizo push, PR, merge o deploy. El propietario detuvo la autorización anterior. La receta local no tiene interruptor remoto: una entrega autorizada debe preparar el ejecutor de producción, repetir las verificaciones, conservar respaldo y versiones, configurar Vimeo y revalidar `/ver`, sus 16 detalles y las fichas existentes. Los nuevos IDs se toman del resultado de esa ejecución, no de los IDs asignados en esta prueba local.
