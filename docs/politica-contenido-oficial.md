# Política de contenido oficial

> MundoBL no aloja, no re-sube y no enlaza contenido que no sea de quien lo hizo o de quien tiene licencia para distribuirlo. Preferimos tener menos series para ver antes que beneficiarnos del trabajo de otros o causarle un problema a alguien.

Vigente desde 2026-09-21; ampliación local solicitada por el propietario el 2026-10-24 para incorporar otras plataformas. Aplica a todo el catálogo, a los aportes de usuarios y colaboradores, y a lo que carga el equipo.

## Reglas

1. **Episodios embebidos**: obras publicadas por su autor, productora o distribuidora oficial, con reproducción pública permitida. YouTube usa `src/lib/official-channels.ts` y la identidad real devuelta por la Data API. Vimeo y Dailymotion usan `src/lib/official-video-publishers.ts`: ID estable del propietario, obras verificadas y evidencia de autoría/distribución. Un nombre de canal enviado por el cliente nunca acredita oficialidad.
2. **Otras plataformas de video**: Vimeo se verifica con su API (propietario, duración, video disponible, privacidad pública e inserción pública) y oEmbed sin autenticación. Dailymotion exige un Player ID propio configurado y verificaciones equivalentes; sin configuración o sin obras acreditadas no se admiten episodios. Bilibili continúa limitado a trailers/clips de fuentes oficiales en `/contenido`. No se aceptan compras, alquileres, contraseñas, membresías o DRM como si fueran episodios gratuitos.
3. **"Dónde ver"**: solo plataformas con licencia (Viki, GagaOOLala, iQIYI, WeTV, Netflix, Viu, Youku, Prime, Disney+, Max, Apple TV, Crunchyroll, Rakuten, Bilibili.tv, Shortime) o el canal oficial de YouTube. Nunca sitios de re-subida, grupos de Telegram ni agregadores.
4. **Sin excepciones por popularidad**: si una serie solo está disponible en re-subidas, la ficha existe como catálogo (metadata, tracking, reseñas) pero sin "ver".
5. **Lo que ya estaba cargado** se limpia con `scripts/cleanup-unofficial-content.ts` y no se vuelve a cargar.

## Cómo se aplica en el código

| Punto de entrada | Qué hace |
| --- | --- |
| `POST /api/user/series/embed/preview` y `confirm` (aportes en `/ver/agregar`) | Verifican la fuente y disponibilidad por plataforma. Confirmar vuelve a comprobar permisos aunque existiera una vista previa. Guarda el autor verificado, no el que mandó el cliente. |
| `POST /api/series/import-playlist/confirm` (importador admin y colaboradores) | Verifica todos los videos de la playlist; uno solo fuera de la lista rechaza el import entero. |
| `POST /api/episodes` y `PUT /api/episodes/[id]` (alta y edición manual) | Mismo chequeo; una URL vacía sigue siendo válida (episodio sin embed). |
| `src/lib/official-content-guard.ts` | Entrada compartida para resolver episodios. `external-episode-source.ts` verifica Vimeo/Dailymotion. Sin verificación no hay embed; una falla temporal del proveedor devuelve 503. |
| `src/lib/playability-audit.ts` | Revisa también Vimeo/Dailymotion; no convierte un timeout o una credencial vencida en una baja de contenido. |

## Cómo sumar un canal a la lista

Para Vimeo/Dailymotion, documentar autoría con una fuente primaria, verificar el ID estable del propietario y cada obra elegida, y agregar la entrada a `official-video-publishers.ts`. El permiso técnico de embed por sí solo no prueba que una resubida sea oficial. Probar el reproductor público y registrar duración, país y fecha. Las versiones de pago quedan como enlaces a su plataforma.

1. Abrir el canal en YouTube y confirmar que el título es el de la productora o distribuidora. Los handles "obvios" son casi siempre homónimos.
2. Agregar `{ name, handle, channelId: null, country }` en `src/lib/official-channels.ts`.
3. Correr `npx tsx scripts/resolve-official-channel-ids.ts`, verificar el título que devuelve y pegar el `channelId`.
4. PR con el motivo. Los usuarios pueden pedir un canal desde Feedback.

## Limpieza de datos existentes

```bash
npx tsx scripts/cleanup-unofficial-content.ts
```

Lista, sin tocar nada: episodios con embed fuera de la lista, series de usuarios que quedan vacías, links a hosts piratas, y links que hay que revisar a mano. Con `--apply` vacía los embeds, oculta las series vacías y borra los links piratas. Lo que está en "revisar a mano" nunca se toca solo.

Registro de corridas (fecha, quién, resultado):

| Fecha | Quién | Resultado |
| --- | --- | --- |
| | | |
