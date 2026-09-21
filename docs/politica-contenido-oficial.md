# Política de contenido oficial

> MundoBL no aloja, no re-sube y no enlaza contenido que no sea de quien lo hizo o de quien tiene licencia para distribuirlo. Preferimos tener menos series para ver antes que beneficiarnos del trabajo de otros o causarle un problema a alguien.

Vigente desde 2026-09-21. Aplica a todo el catálogo, a los aportes de usuarios y colaboradores, y a lo que carga el equipo.

## Reglas

1. **Episodios embebidos**: solo videos publicados por el **canal oficial de YouTube** de la productora o distribuidora. La lista blanca vive en `src/lib/official-channels.ts` y se verifica contra la YouTube Data API (canal real del video), nunca contra lo que declara quien lo carga.
2. **Otras plataformas de video** (Vimeo, Bilibili, Dailymotion): por ahora no se aceptan episodios embebidos. Sí se aceptan trailers y clips en `/contenido` si son del canal oficial.
3. **"Dónde ver"**: solo plataformas con licencia (Viki, GagaOOLala, iQIYI, WeTV, Netflix, Viu, Youku, Prime, Disney+, Max, Apple TV, Crunchyroll, Rakuten, Bilibili.tv, Shortime) o el canal oficial de YouTube. Nunca sitios de re-subida, grupos de Telegram ni agregadores.
4. **Sin excepciones por popularidad**: si una serie solo está disponible en re-subidas, la ficha existe como catálogo (metadata, tracking, reseñas) pero sin "ver".
5. **Lo que ya estaba cargado** se limpia con `scripts/cleanup-unofficial-content.ts` y no se vuelve a cargar.

## Cómo se aplica en el código

| Punto de entrada | Qué hace |
| --- | --- |
| `POST /api/user/series/embed/confirm` (aportes en `/ver/agregar`) | Rechaza con 422 si el video no es de un canal de la lista. Guarda el canal verificado, no el que mandó el cliente. |
| `POST /api/series/import-playlist/confirm` (importador admin y colaboradores) | Verifica todos los videos de la playlist; uno solo fuera de la lista rechaza el import entero. |
| `POST /api/episodes` y `PUT /api/episodes/[id]` (alta y edición manual) | Mismo chequeo; una URL vacía sigue siendo válida (episodio sin embed). |
| `src/lib/official-content-guard.ts` | Único lugar con la lógica. Si la API de YouTube no responde, se rechaza con 503: sin verificación no hay embed. |

## Cómo sumar un canal a la lista

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
