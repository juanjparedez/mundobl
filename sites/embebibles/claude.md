# mundobl.win — Guía de Integración de Video Embebido

**Documentación Técnica v1.0 — Febrero 2026**
**Solo contenido legítimo y con créditos**

> Ningún contenido es alojado en mundobl.win — todo el video pertenece a sus respectivos creadores.

---

## 1. Principios de Integración

Este documento detalla **exclusivamente plataformas que ofrecen mecanismos oficiales de embed** (iframe, oEmbed, SDK) para integrar video en mundobl.win. **Ningún video se aloja, descarga o redistribuye.** Todo el contenido se reproduce desde los servidores originales del creador, respetando su monetización, analíticas y derechos.

### Reglas de Oro para mundobl.win

| Regla                      | Descripción                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **CRÉDITOS SIEMPRE**       | Cada video embebido debe mostrar: nombre del canal/creador, link directo al video original, y nombre de la plataforma fuente |
| **SIN DESCARGAS**          | Nunca descargar, alojar o redistribuir videos. El contenido siempre se sirve desde la plataforma original via iframe/SDK     |
| **RESPETAR RESTRICCIONES** | Si un creador desactiva el embed en su video, respetar esa decisión. No buscar workarounds                                   |
| **MONETIZACIÓN INTACTA**   | Los embeds de YouTube mantienen los ads del creador. Nunca usar parámetros que oculten o interfieran con la monetización     |
| **DMCA READY**             | Implementar mecanismo de takedown: si un creador pide remover su embed, hacerlo en <24h                                      |

---

## 2. YouTube — Plataforma Principal

YouTube es la **fuente #1 de video BL embebible**. Las productoras más grandes del mundo BL publican episodios completos y trailers oficialmente en YouTube con subtítulos multilenguaje. El embed es una funcionalidad **oficial y fomentada** por YouTube — el botón "Compartir → Embed" está en cada video.

### 2.1 Código de Embed Básico

```html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Título del video - Canal Original"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write;
    encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```

### 2.2 Parámetros Útiles

| Parámetro          | Ejemplo             | Efecto                                                      |
| ------------------ | ------------------- | ----------------------------------------------------------- |
| `rel=0`            | `?rel=0`            | Al terminar, sugiere videos del mismo canal (no aleatorios) |
| `cc_load_policy=1` | `?cc_load_policy=1` | Activa subtítulos automáticamente (ideal para BL asiático)  |
| `cc_lang_pref=es`  | `&cc_lang_pref=es`  | Prefiere subtítulos en español                              |
| `hl=es`            | `&hl=es`            | Interfaz del player en español                              |
| `start=120`        | `&start=120`        | Empieza en el segundo 120 (para escenas específicas)        |
| `modestbranding=1` | `&modestbranding=1` | Reduce branding de YouTube (logo más pequeño)               |
| `list=PLAYLIST_ID` | `?list=PLxxxxxx`    | Embebe una playlist completa                                |

### 2.3 YouTube IFrame Player API

Para control programático avanzado (pausar, detectar fin de video, eventos):

```javascript
// Cargar la API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.body.appendChild(tag);

// Crear player con eventos
function onYouTubeIframeAPIReady() {
  const player = new YT.Player('player-div', {
    videoId: 'VIDEO_ID',
    playerVars: { rel: 0, cc_load_policy: 1 },
    events: {
      onStateChange: (e) => {
        // 0=ended, 1=playing, 2=paused
        if (e.data === 0) showCreditsOverlay();
      },
    },
  });
}
```

**Documentación oficial:**

- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- [Parámetros del Player](https://developers.google.com/youtube/player_parameters)

### 2.4 YouTube Data API v3 — Buscar Videos BL

Para construir un catálogo automático de videos BL, la **YouTube Data API v3** permite buscar y listar videos de canales específicos. Requiere una **API Key gratuita** de Google Cloud Console. Cuota: 10,000 unidades/día.

```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &channelId=UCxxxx        // ID del canal GMMTV, etc.
  &q=BL+series+EP1         // Query de búsqueda
  &type=video
  &maxResults=25
  &key=TU_API_KEY
```

### 2.5 Canales YouTube Oficiales BL con Embed Habilitado

Estos canales publican **episodios completos gratuitos** con subtítulos y **embed habilitado por defecto**:

| Canal                 | País         | Contenido                             | YouTube Handle         |
| --------------------- | ------------ | ------------------------------------- | ---------------------- |
| **GMMTV**             | Tailandia    | Episodios completos + trailers + OSTs | `@GMMTV`               |
| **Be On Cloud**       | Tailandia    | KinnPorsche, DFF, 4 Minutes           | `@BeOnCloudOfficial`   |
| **Domundi TV**        | Tailandia    | Cutie Pie, Bed Friend                 | `@DomundiBoys`         |
| **Mandee Work**       | Tailandia    | Pit Babe, My Stand-In                 | `@MandeeWork`          |
| **Dee Hup House**     | Tailandia    | Not Me, Manner of Death               | `@DeeHupHouse`         |
| **Star Hunter**       | Tailandia    | Múltiples series BL                   | `@StarHunterStudio`    |
| **Studio Wabi Sabi**  | Tailandia    | Love By Chance, UWMA                  | `@StudioWabiSabi`      |
| **Strongberry**       | Corea        | Where Your Eyes Linger, Color Rush    | `@Strongberry`         |
| **Playlist Global**   | Corea        | Light on Me, web dramas               | `@PlaylistGlobal`      |
| **The IdeaFirst Co.** | Filipinas    | Gameboys, Ben X Jim                   | `@TheIdeaFirstCompany` |
| **iQIYI**             | China/Global | Trailers BL (no eps. completos)       | `@iQIYI`               |

### 2.6 Restricciones de YouTube a Respetar

| Restricción          | Detalle                                 | Impacto en mundobl.win                              |
| -------------------- | --------------------------------------- | --------------------------------------------------- |
| Tamaño mínimo        | 200×200 px                              | Diseñar player cards de al menos 280×158 px         |
| Branding obligatorio | Logo YouTube debe ser visible           | No cubrir ni ocultar el logo con overlays           |
| Embed desactivado    | El creador puede desactivarlo por video | Chequear antes de agregar; mostrar link alternativo |
| Geo-restricción      | Algunos videos limitados por país       | Mostrar mensaje alternativo si el video no carga    |
| Monetización         | Ads del creador se muestran en embed    | NUNCA interferir con los ads — es su ingreso        |

---

## 3. Bilibili — Contenido Chino/Dangai

Bilibili es la plataforma china equivalente a YouTube, con un ecosistema BL/dangai significativo. Ofrece embed oficial via iframe con su player propietario.

### 3.1 Código de Embed

```html
<!-- Embed por BVID (recomendado) -->
<iframe
  src="https://player.bilibili.com/player.html
    ?bvid=BV1xx411x7xx&page=1&high_quality=1"
  width="640"
  height="360"
  scrolling="no"
  frameborder="0"
  allowfullscreen="true"
></iframe>
```

### 3.2 Parámetros de Bilibili

| Parámetro      | Valores              | Uso                                                |
| -------------- | -------------------- | -------------------------------------------------- |
| `bvid`         | BV + ID alfanumérico | Identificador del video (recomendado sobre aid)    |
| `page`         | 1, 2, 3...           | Número de parte del video (multi-part)             |
| `high_quality` | 0 o 1                | Forzar calidad alta (1=on)                         |
| `danmaku`      | 0 o 1                | Activar/desactivar comentarios flotantes (danmaku) |
| `autoplay`     | 0 o 1                | Reproducción automática                            |
| `t`            | Segundos             | Tiempo de inicio                                   |

### 3.3 Limitaciones de Bilibili

⚠️ **Contenido bangumi licenciado** (series completas licenciadas como anime y dramas) **NO permite embed externo**. Solo videos UGC (subidos por usuarios/canales oficiales) son embebibles.

⚠️ **Geo-restricción:** Muchos videos están limitados a China continental. Para una audiencia LATAM como la de mundobl.win, verificar disponibilidad desde Argentina antes de embeber.

---

## 4. Dailymotion — Opción Secundaria

Dailymotion tiene un sistema de embed robusto y bien documentado. Aunque su catálogo BL es limitado, algunos fans y distribuidores menores suben contenido. **Verificar siempre que el video sea subido por el titular de derechos.**

### 4.1 Código de Embed

```html
<!-- Dailymotion Embed Script (recomendado) -->
<script
  src="https://geo.dailymotion.com/player/xkTEq.js"
  data-video="VIDEO_ID"
></script>

<!-- O bien, iframe clásico -->
<iframe
  src="https://www.dailymotion.com/embed/video/VIDEO_ID"
  width="640"
  height="360"
  allowfullscreen
  allow="autoplay"
></iframe>
```

**Documentación:**

- [Dailymotion Player Docs](https://developers.dailymotion.com/player/)
- [Embed Script Guide](https://developers.dailymotion.com/docs/player-embed-script-web)

---

## 5. Vimeo — Para Contenido Premium/Indie

Vimeo es usado por cineastas independientes y productoras pequeñas. Algunos cortos BL y documentales se publican aquí. Ofrece **el embed más personalizable** de todas las plataformas.

### 5.1 Código de Embed

```html
<iframe
  src="https://player.vimeo.com/video/VIDEO_ID
    ?badge=0&autopause=0&player_id=0"
  width="640"
  height="360"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
></iframe>
```

Vimeo ofrece **oEmbed** (`https://vimeo.com/api/oembed.json?url=VIDEO_URL`) que devuelve HTML de embed listo para usar, además de un **Player SDK JavaScript** para control avanzado.

---

## 6. Embeds de Redes Sociales

Los embeds de redes sociales son ideales para **noticias, trailers cortos y contenido de comunidad**:

| Plataforma    | Método de Embed                                                                              | Uso en mundobl.win                                            |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Twitter/X** | Botón "Embed Tweet". Genera `<blockquote>` + script `platform.twitter.com/widgets.js`        | Anuncios de series, trailers oficiales, reacciones de actores |
| **Instagram** | Botón "⋯ → Embed" en posts públicos. Genera `<blockquote>` + script `instagram.com/embed.js` | Fotos oficiales de sets, posters, behind the scenes           |
| **TikTok**    | Botón "Embed" en cada video. Genera `<blockquote>` + script `tiktok.com/embed.js`            | Edits de fans, reacciones, clips virales (verificar derechos) |
| **Tumblr**    | Botón "Embed" en cada post. Genera `<div>` + script `assets.tumblr.com/post.js`              | Reviews de Absolute BL, fan art, GIF sets                     |
| **Spotify**   | Botón "Embed" en tracks/playlists. iframe directo: `open.spotify.com/embed/...`              | OSTs de series BL, playlists temáticas                        |

> ℹ️ Todos estos embeds cargan el contenido directamente desde la plataforma original. El usuario de mundobl.win verá el post/video con el nombre del creador original, sus links y su branding intactos.

---

## 7. Plataformas que NO Permiten Embed

Es igual de importante saber qué **NO se puede embeber**. Estas plataformas tienen contenido BL significativo pero **bloquean el embed externo por DRM/licencias**. Para estas, la estrategia es **linkear directamente**:

| Plataforma         | Contenido BL                                  | Alternativa para mundobl.win                    |
| ------------------ | --------------------------------------------- | ----------------------------------------------- |
| **Viki (Rakuten)** | Dramas BL extensos, subs en 200+ idiomas      | Link directo + botón "Ver en Viki"              |
| **Crunchyroll**    | ~25+ anime BL (Given, Sasaki & Miyano...)     | Link directo + card con thumbnail (YouTube API) |
| **GagaOOLala**     | 1,600+ títulos LGBTQ+ — plataforma BL premier | Link directo + badge "Disponible en GagaOOLala" |
| **Netflix**        | Heartstopper, Young Royals, The Untamed       | Link directo a netflix.com/title/...            |
| **iQIYI**          | BL tailandés y dangai chino                   | Link directo + nota de disponibilidad regional  |
| **WeTV**           | BL tailandés, chino y taiwanés                | Link directo + nota de disponibilidad regional  |
| **Manta**          | Manhwa BL (Semantic Error, Love Jinx)         | Link a manta.net + miniatura                    |
| **Lezhin Comics**  | Manhwa BL premium #1                          | Link directo al título                          |

**Estrategia de linking recomendada:** Para estas plataformas, crear cards con: thumbnail del título (obtenido via API de TMDB/AniList/YouTube), título y sinopsis, botón con logo de la plataforma → link directo, y nota "Contenido disponible en [plataforma] — no afiliado".

---

## 8. Componente React Sugerido: VideoEmbed

Un componente unificado para manejar todos los embeds con atribución automática:

```typescript
interface VideoEmbedProps {
  platform: 'youtube' | 'bilibili' | 'dailymotion' | 'vimeo';
  videoId: string;
  title: string; // Título del video
  channelName: string; // Nombre del canal/creador
  channelUrl: string; // Link al canal original
  originalUrl: string; // Link directo al video
  subtitles?: 'es' | 'en'; // Preferencia de subs
}

// El componente renderiza:
// 1. iframe de la plataforma correspondiente
// 2. Barra de créditos debajo del player:
//    "[Logo] Video de {channelName} en {platform}"
//    "[Link] Ver original en {platform}"
// 3. Link nofollow al video original
```

---

## 9. Checklist de Implementación

Antes de embeber cualquier video en mundobl.win, verificar:

- [ ] El video fue subido por el titular de derechos o una cuenta oficial
- [ ] El embed está habilitado en el video (probar el iframe antes de publicar)
- [ ] Se incluyen créditos visibles: nombre del canal, plataforma y link original
- [ ] No se descarga ni se re-aloja ningún archivo de video
- [ ] No se usan parámetros que oculten el branding de la plataforma
- [ ] La monetización del creador original no se ve afectada
- [ ] Se implementa un mecanismo de takedown por si un creador pide remover su contenido
- [ ] El disclaimer general de mundobl.win indica que todo el contenido pertenece a sus creadores
- [ ] Los thumbnails usados en cards de linking provienen de APIs públicas (TMDB, AniList, YouTube)
- [ ] Se verifica periódicamente que los embeds sigan funcionando (videos borrados/privados)

---

## 10. Resumen Rápido de Plataformas

| Plataforma  | Embed         | API            | Contenido BL                  | Prioridad      |
| ----------- | ------------- | -------------- | ----------------------------- | -------------- |
| YouTube     | ✅ Completo   | ✅ Data API v3 | Extenso — episodios completos | **PRINCIPAL**  |
| Bilibili    | ✅ iframe     | ⚠️ No oficial  | Dangai chino (geo-limitado)   | **SECUNDARIA** |
| Dailymotion | ✅ iframe+SDK | ✅ Player API  | Mínimo BL                     | Terciaria      |
| Vimeo       | ✅ iframe+SDK | ✅ oEmbed+API  | Indie/cortos BL               | Terciaria      |
| Twitter/X   | ✅ Widget     | ✅ oEmbed      | Noticias, trailers            | Complemento    |
| Instagram   | ✅ Widget     | ✅ oEmbed      | Fotos, posters                | Complemento    |
| TikTok      | ✅ Widget     | ✅ oEmbed      | Edits, reacciones             | Complemento    |
| Spotify     | ✅ iframe     | ✅ Web API     | OSTs BL                       | Complemento    |
| Viki        | ❌ No         | ❌ No          | Extenso                       | Solo linking   |
| Crunchyroll | ❌ No         | ❌ No          | ~25+ anime BL                 | Solo linking   |
| GagaOOLala  | ❌ No         | ❌ No          | 1,600+ LGBTQ+                 | Solo linking   |
| Netflix     | ❌ No         | ❌ No          | Selectivo                     | Solo linking   |

---

> ❤️ **Disclaimer de mundobl.win:** mundobl.win no aloja, descarga ni redistribuye ningún contenido audiovisual. Todo el video se reproduce directamente desde las plataformas originales via embed oficial. Todos los derechos pertenecen a sus respectivos creadores y distribuidores.
