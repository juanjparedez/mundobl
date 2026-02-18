# Plataformas de video con embedding legal para mundobl.win

## Resumen ejecutivo

Para usar video como “color” en mundobl.win (trailers, clips, entrevistas, reacciones, highlights) sin meterse en zonas grises, la estrategia con mejor relación **impacto/riesgo** es:

1. Priorizar plataformas con **embed nativo y ampliamente soportado** (YouTube, Vimeo, Dailymotion, Twitch, TikTok, Bilibili, Rumble, Odysee), donde el reproductor se inserta oficialmente vía `<iframe>`/SDK y el **propietario del video controla si se puede embeber** (o si está limitado por dominio). Esto es explícito en las guías de embedding y settings (ej. “Allow embedding” / “Specific domains”). citeturn11view5turn11view3turn6view7turn11view2turn6view6turn4search3turn4search11turn3search1

2. Tratar las OTT/licenciadoras (Viki, WeTV, GagaOOLala; y en la práctica también iQIYI si no se opera como partner) como **link-out** (enlace a origen) y _no_ como embed de episodios, porque sus términos suelen restringir framing/uso no autorizado y/o el consumo está condicionado por DRM, cuenta/planes, geolocalización y acuerdos de licencia. En Viki, por ejemplo, se prohíbe expresamente usar medios tecnológicos para “access, index, frame or link” no autorizados. citeturn10view0turn6view3turn6view8

3. Operativamente, el sitio debería implementar un **flujo de decisión + fallback**: intentar embed solo si está permitido y estable; si falla o hay geobloqueo/edad/DRM, mostrar tarjeta con imagen + botón “Ver en la plataforma” (abre en pestaña nueva), y un aviso claro de que el contenido pertenece a terceros. En YouTube esto es especialmente relevante con videos con restricción de edad (frecuentemente redirigen a YouTube en vez de reproducir embebidos). citeturn11view5turn10view0

4. En privacidad y cookies: activar “Privacy Enhanced Mode” de YouTube cuando sea posible (youtube-nocookie.com) y, en general, **no cargar iframes hasta que el usuario consienta** (si tu política/mercado lo requiere), porque muchos embeds disparan requests a terceros. YouTube documenta el cambio de dominio para ese modo mejorado. citeturn11view5

## Criterios legales y arquitectura recomendada para embeds

Todo embed debe tratarse como una **vista embebida de un reproductor de terceros**: el hecho de que exista un `<iframe>` no te transfiere derechos de autor ni habilita “republicar” el contenido; solo integra un reproductor, y esa integración queda sujeta a políticas/ToS del proveedor y a la configuración del uploader. En YouTube, por ejemplo, el propio help center recuerda que aplican los términos/políticas para el uso del embedded player y que el uploader puede deshabilitar “Allow embedding”. citeturn11view5

Recomendación de arquitectura para mundobl.win:

- **Capa 1: “Embed permitido” (default)**  
  Embeds de trailers/clips oficiales, detrás de un componente común que asegura: crédito visible, link al origen, lazy-load y parámetros seguros.
- **Capa 2: “Solo link-out”**  
  Para OTT (Viki/WeTV/GagaOOLala) y cualquier plataforma donde el embed sea condicional por partner/SDK o donde los términos prohíban framing/uso no autorizado.
- **Capa 3: “Fallback por bloqueo”**  
  Cuando el embed muestra error (edad, región, embed deshabilitado, contenido premium), renderizar tarjeta de salida.

```mermaid
flowchart TD
  A[Elegir video para “color”] --> B{¿La plataforma ofrece embed oficial?}
  B -- No --> L[No embeber<br/>Usar link-out + tarjeta]
  B -- Sí --> C{¿El video está configurado<br/>para permitir embedding?}
  C -- No/Desconocido --> L
  C -- Sí --> D{¿Hay restricciones prácticas?<br/>edad, región, premium, login}
  D -- Probable/Sí --> E[Mostrar embed + fallback visible<br/>“Si no se ve, abrir en…”]
  D -- No --> F[Mostrar embed normal]
  E --> G[Registrar métricas internas<br/>(sin scraping)]
  F --> G
```

## Tabla comparativa compacta

| Plataforma          | Permite embed                                                                 | Requiere partner/API                                                          | Restricciones clave                                                                                                      | Ejemplo de código (referencia)                                                              |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| YouTube             | Sí (condicional por uploader) citeturn11view5                              | No para iframe; API opcional citeturn11view0                               | Puede deshabilitarse “Allow embedding”; videos con restricción de edad suelen no reproducir embebidos citeturn11view5 | Iframe `/embed/VIDEO_ID` con parámetros (`autoplay`, `controls`, etc.) citeturn11view0   |
| Vimeo               | Sí (condicional; control por dominio/plan) citeturn11view3                 | No                                                                            | “Specific domains” no está en Free/Basic; privacidad puede bloquear embeds citeturn11view3                            | Iframe `player.vimeo.com/video/ID` citeturn11view3                                       |
| Dailymotion         | Sí                                                                            | Opcional (API/oEmbed) citeturn6view7                                       | Recomiendan script embed; iframe “solo para entornos que restringen JS” citeturn6view7                                | Iframe con Player ID `geo.dailymotion.com/player/{player}.html?video=...` citeturn6view7 |
| Twitch              | Sí                                                                            | No                                                                            | Requiere `parent` (dominios) en embed JS/iframe citeturn11view2                                                       | Script `https://player.twitch.tv/js/embed/v1.js` + options citeturn11view2               |
| Bilibili            | Sí                                                                            | No                                                                            | Embed mediante `player.bilibili.com/player.html` (doc oficial) citeturn4search3                                       | Iframe con `bvid=...` citeturn4search3                                                   |
| iQIYI               | Condicional (orientado a integración/Player API) citeturn6view0turn6view1 | Frecuente (dev/keys/SDK) citeturn6view1                                    | No es “copiar iframe”: integración vía Player API/partners en muchos casos citeturn6view0                             | Depende de Player API (ver notas) citeturn6view0                                         |
| WeTV                | No recomendado (ToS restringe incorporar plataforma) citeturn6view3        | —                                                                             | Prohíbe “incorporate the Platform… into any other program or product” citeturn6view3                                  | No aplica (usar link-out)                                                                   |
| Viki                | No (framing/linking no autorizado) citeturn10view0turn10view1             | —                                                                             | Prohíbe “frame or link” no autorizado y evadir DRM citeturn10view0turn10view1                                        | No aplica (usar link-out + tráiler en YouTube)                                              |
| LINE TV             | No (servicio cerrado en Tailandia) citeturn3search7turn3search3           | —                                                                             | Servicio finalizó (al menos Tailandia) citeturn3search7                                                               | No aplica                                                                                   |
| GagaOOLala          | No (OTT; uso personal; sin embed público) citeturn6view8                   | —                                                                             | Cuenta “personal use”; prohíbe replicar/redistribuir/stream público o a terceros citeturn6view8                       | No aplica (usar link-out)                                                                   |
| Facebook/Meta Video | Sí (plugin/SDK) citeturn8search19turn8search7                             | No para plugin; oEmbed/API para otros flujos citeturn1search7              | Requiere cargar SDK; embed depende de visibilidad (público) citeturn8search19                                         | `<div class="fb-video" data-href="...">` + SDK citeturn8search19                         |
| TikTok              | Sí (blockquote+script / oEmbed) citeturn6view6                             | No para copiar embed; oEmbed para generar markup citeturn6view6            | Embed muestra atribución y link al contenido original citeturn6view6                                                  | `<blockquote class="tiktok-embed">` + `embed.js` citeturn6view6                          |
| Instagram Video     | Sí (si cuenta/contenido público) citeturn5search1turn5search5             | oEmbed/API puede requerir app/tokens (Meta) citeturn1search2turn1search16 | Solo contenido público embebible; APIs pueden exigir tokens/review citeturn5search1turn1search16                     | Embed desde “copiar código” (ver snippet) citeturn5search1                               |
| Rumble              | Sí (iframe) citeturn4search11turn4search0                                 | No                                                                            | Puede haber contenido premium/no embebible; el sitio provee “Embed Code” citeturn4search8turn4search11               | `<iframe src="https://rumble.com/embed/...">` citeturn4search11                          |
| Odysee              | Sí (iframe) citeturn3search1                                               | No                                                                            | Embedding documentado vía iframe con URL copiada citeturn3search1                                                     | `<iframe src="COPIED_EMBED_URL">` citeturn3search1                                       |

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["YouTube embed code iframe screenshot","Vimeo embed privacy specific domains setting","Twitch embed parent parameter documentation screenshot","Bilibili external player iframe example"],"num_per_query":1}

## Detalle por plataforma

A continuación, cada plataforma con (1) estado de embed, (2) condiciones legales principales, (3) requisitos técnicos, (4) limitaciones prácticas, (5) snippet listo, (6) links oficiales, y (7) recomendación operativa específica para mundobl.win.

**YouTube** (entity["company","YouTube","video platform"])  
Permite embed: **Sí (condicional)**. El uploader puede desactivar “Allow embedding”. citeturn11view5  
Condiciones legales principales: el Help Center recuerda que aplican los términos/políticas del uso del embedded player; además, videos con restricción por edad suelen no reproducirse en sitios de terceros. citeturn11view5  
Requisitos técnicos: iframe `/embed/VIDEO_ID` con parámetros; opción de “Privacy Enhanced Mode” usando `youtube-nocookie.com`. citeturn11view0turn11view5  
Limitaciones prácticas: restricción por edad; geobloqueos por derechos; embed deshabilitado por uploader. citeturn11view5  
Snippet:

```html
<!-- YouTube iframe (recomendado: modo privacidad mejorada) -->
<iframe
  width="560"
  height="315"
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=0&controls=1&rel=0"
  title="Video de YouTube (tercero)"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
  loading="lazy"
>
</iframe>

<p class="credit">
  Fuente: YouTube ·
  <a
    href="https://www.youtube.com/watch?v=VIDEO_ID"
    target="_blank"
    rel="noopener"
    >Ver en YouTube</a
  >
</p>
```

Links oficiales (copiar/pegar):

```text
https://support.google.com/youtube/answer/171780?hl=en
https://developers.google.com/youtube/player_parameters
https://developers.google.com/youtube/iframe_api_reference
```

Recomendación mundobl.win: usar YouTube principalmente para **trailers oficiales** y clips de canales con derechos; activar `youtube-nocookie.com` por defecto; mostrar siempre “Fuente + Ver en YouTube”. citeturn11view5turn11view0

**Vimeo** (entity["company","Vimeo","video platform"])  
Permite embed: **Sí (condicional)**. Controles de privacidad determinan si y dónde puede embeberse. citeturn11view3  
Condiciones legales: el dueño del video puede limitar “Where can this be embedded?” (Anywhere/Nowhere/Specific domains). “Specific domains” está disponible para planes excepto Free/Basic. citeturn11view3  
Requisitos técnicos: iframe `player.vimeo.com/video/ID`. citeturn11view3  
Limitaciones prácticas: si el owner configuró dominio allowlist, el embed en mundobl.win fallará hasta que agreguen el dominio. citeturn11view3turn11view4  
Snippet:

```html
<iframe
  src="https://player.vimeo.com/video/VIDEO_ID"
  width="640"
  height="360"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
  loading="lazy"
>
</iframe>

<p class="credit">
  Fuente: Vimeo ·
  <a href="https://vimeo.com/VIDEO_ID" target="_blank" rel="noopener"
    >Ver en Vimeo</a
  >
</p>
```

Links oficiales:

```text
https://help.vimeo.com/hc/en-us/articles/12426259908881-How-to-embed-my-video
https://help.vimeo.com/hc/en-us/articles/30030693052305-How-do-I-set-up-domain-level-privacy
```

Recomendación: excelente para **trailers de productoras** y festivales; si trabajás con partners, pedí que habiliten “Specific domains” para `mundobl.win`. citeturn11view3turn11view4

**Dailymotion** (entity["company","Dailymotion","video platform"])  
Permite embed: **Sí**.  
Condiciones legales: usar métodos oficiales de embed (Studio/API). citeturn6view7  
Requisitos técnicos: iframe con Player ID; la propia doc advierte que el iframe es principalmente para entornos que restringen JS y recomienda métodos “script embed” cuando sea posible. citeturn6view7  
Limitaciones prácticas: necesitás un Player ID (configurable en Studio) para el endpoint `geo.dailymotion.com/player/{PlayerID}.html`. citeturn6view7  
Snippet (según doc oficial):

```html
<iframe
  frameborder="0"
  width="640"
  height="360"
  src="https://geo.dailymotion.com/player/PLAYER_ID.html?video=VIDEO_ID"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; web-share"
  loading="lazy"
>
</iframe>

<p class="credit">
  Fuente: Dailymotion ·
  <a
    href="https://www.dailymotion.com/video/VIDEO_ID"
    target="_blank"
    rel="noopener"
    >Ver en Dailymotion</a
  >
</p>
```

Links oficiales:

```text
https://developers.dailymotion.com/docs/iframe-web
```

Recomendación: útil si encontrás canales oficiales BL ahí; mantener el componente de crédito y fallback igual que YouTube.

**Twitch** (entity["company","Twitch","live streaming platform"])  
Permite embed: **Sí**.  
Condiciones legales: embedding soportado oficialmente. citeturn11view1turn11view2  
Requisitos técnicos: vía script embed (`embed/v1.js`) u otras guías; el parámetro **`parent`** es crítico para dominios. citeturn11view2  
Limitaciones prácticas: si `parent` no incluye el dominio correcto, el embed falla; mínimos de ancho/alto aplican en la guía. citeturn11view2  
Snippet (documentado):

```html
<script src="https://player.twitch.tv/js/embed/v1.js"></script>
<div id="twitch-embed"></div>
<script>
  new Twitch.Player('twitch-embed', {
    width: 640,
    height: 360,
    channel: 'CHANNEL_NAME',
    parent: ['mundobl.win'], // agregar también www si aplica
  });
</script>

<p class="credit">
  Fuente: Twitch ·
  <a href="https://www.twitch.tv/CHANNEL_NAME" target="_blank" rel="noopener"
    >Ver en Twitch</a
  >
</p>
```

Links oficiales:

```text
https://dev.twitch.tv/docs/embed/
https://dev.twitch.tv/docs/embed/video-and-clips/
```

Recomendación: Twitch como “color” funciona mejor para **eventos en vivo, entrevistas y watch-parties** (siempre que el creador tenga derechos). Mantener fallback: “Si no se ve, abrir en Twitch”.

**Bilibili** (entity["company","Bilibili","chinese video platform"])  
Permite embed: **Sí** (documentación oficial del “站外(外链)播放器”). citeturn4search3  
Condiciones legales: usar el reproductor externo oficial `player.bilibili.com/player.html`. citeturn4search3  
Requisitos técnicos: iframe con parámetros como `bvid`. citeturn4search3  
Limitaciones prácticas: algunos sitios/CMS bloquean iframes por allowlist; además, parte del contenido puede tener restricciones regionales o de cuenta (caso a caso).  
Snippet (del doc oficial):

```html
<iframe
  src="//player.bilibili.com/player.html?bvid=BVXXXXXXXXXXX"
  scrolling="no"
  frameborder="no"
  allowfullscreen="true"
  width="640"
  height="360"
>
</iframe>

<p class="credit">
  Fuente: Bilibili ·
  <a
    href="https://www.bilibili.com/video/BVXXXXXXXXXXX"
    target="_blank"
    rel="noopener"
    >Ver en Bilibili</a
  >
</p>
```

Links oficiales:

```text
https://player.bilibili.com/
```

Recomendación: usar Bilibili para trailers/clips oficiales cuando el link sea público y reproducible fuera; fallback obligatorio.

**iQIYI** (entity["company","iQIYI","chinese ott platform"])  
Permite embed: **Condicional**. La documentación de iQIYI SaaS describe “Player API” y que se puede embeber en “watching pages”, con endpoints y flujo de developer/solutions. citeturn12view3turn12view1  
Condiciones legales principales: no hay un “iframe universal” documentado en el material citado; el enfoque es **integración vía Player API** y stack SaaS, lo que típicamente implica contratos/keys/condiciones de partner. citeturn12view3turn12view1  
Requisitos técnicos: registración/sign-in en portal developer; uso de Player API. citeturn12view2turn12view3  
Limitaciones prácticas: si no sos partner, tratá iQIYI como **link-out** (y “color” con trailers en YouTube u otras plataformas abiertas).  
Snippet (patrón recomendado para mundobl.win cuando no hay embed público):

```html
<a class="video-card" href="URL_OFICIAL_IQIYI" target="_blank" rel="noopener">
  <img src="POSTER_O_THUMB.jpg" alt="Ver en iQIYI" loading="lazy" />
  <span>▶ Ver en iQIYI</span>
</a>
<p class="credit">Fuente: iQIYI (tercero). Se abre en sitio oficial.</p>
```

Links oficiales:

```text
https://www.iqiyi.com/kszt/getStarted.html
https://saas.iqiyi.com/kszt/Developer_Documentation.html
```

Notas “partner”: el propio portal organiza “Authentication”, “Player API”, “Install the API”, lo que sugiere un onboarding más cercano a integración/partner que a embed liviano. citeturn12view1turn12view3

**WeTV** (entity["company","WeTV","ott platform"])  
Permite embed: **No recomendado / tratar como No**.  
Condiciones legales: su ToS prohíbe “incorporate the Platform or any portion thereof into any other program or product”. citeturn6view3  
Requisitos técnicos: no hay embed público documentado en lo consultado; priorizar link-out.  
Limitaciones prácticas: catálogo por región; cuenta/planes (según título).  
Snippet: usar tarjeta link-out (igual que iQIYI).  
Links oficiales:

```text
https://wetv.qq.com/oversea/terms-en.html
```

**Viki** (entity["company","Rakuten Viki","streaming platform"])  
Permite embed: **No** (para uso no autorizado).  
Condiciones legales: Viki prohíbe usar tecnología para “access, index, frame or link” el servicio/contenido si no está autorizado, y también prohíbe evadir/inhabilitar DRM y sistemas de protección. citeturn10view0turn10view1  
Requisitos técnicos: no hay embed público recomendado; integrar solo vía links oficiales.  
Limitaciones prácticas: DRM, restricciones de región, planes. Esto impacta fuerte la tasa de fallos si intentaras embeber. citeturn10view1  
Snippet: tarjeta link-out.  
Links oficiales:

```text
https://www.viki.com/legal/terms_of_use
```

**LINE TV** (entity["company","LINE TV","video streaming service"])  
Permite embed: **No aplicable** (servicio cerrado al menos en Tailandia; comunicado de cierre para fin de 2021). citeturn3search7turn3search3  
Recomendación: eliminar como dependencia; si aparece como “fuente histórica”, solo conservar referencias en fichas antiguas con “ya no disponible”.

**GagaOOLala** (entity["company","GagaOOLala","lgbtq ott platform"])  
Permite embed: **No** para uso web típico (tratar como link-out).  
Condiciones legales: sus “Service Regulations” afirman que la cuenta es “personal use only” y que no se debe replicar/propagar/vender/stream público ni proveer a terceros para usar “in any other way”. citeturn6view8  
Requisitos técnicos: no hay embed público documentado aquí; priorizar link-out + trailers en plataformas abiertas.  
Snippet: tarjeta link-out.  
Links oficiales:

```text
https://www.gagaoolala.com/en/terms-of-service
https://www.gagaoolala.com/en/home
```

**Facebook/Meta Video** (entity["company","Meta Platforms","technology company"])  
Permite embed: **Sí** vía plugin “Embedded Video Player”. La documentación en español indica los pasos generales: obtener URL, **cargar el SDK para JavaScript**, colocar la etiqueta del reproductor embebido. citeturn8search19turn8search7  
Condiciones legales: el embed está pensado para contenido público (en la práctica); para usos programáticos hay flujos vía oEmbed/Graph API (sujetto a permisos). citeturn1search7turn1search16  
Requisitos técnicos: cargar JS SDK; usar el markup del plugin. citeturn8search19  
Limitaciones prácticas: muchas integraciones dependen del estado “público” del post y de bloqueos de tracking/third-party scripts.  
Snippet (patrón estándar del plugin; adaptar URL y locale):

```html
<div id="fb-root"></div>
<script
  async
  defer
  crossorigin="anonymous"
  src="https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v19.0"
></script>

<div
  class="fb-video"
  data-href="https://www.facebook.com/USER_OR_PAGE/videos/VIDEO_ID/"
  data-width="640"
  data-show-text="false"
></div>

<p class="credit">
  Fuente: Facebook ·
  <a
    href="https://www.facebook.com/USER_OR_PAGE/videos/VIDEO_ID/"
    target="_blank"
    rel="noopener"
    >Ver en Facebook</a
  >
</p>
```

Links oficiales (documentación/ API):

```text
https://developers.facebook.com/docs/plugins/embedded-video-player?locale=es_ES
https://developers.facebook.com/docs/plugins/embedded-video-player/api?locale=es_ES
https://developers.facebook.com/docs/graph-api/reference/oembed-video/
https://developers.facebook.com/docs/features-reference/oembed-read/
```

**TikTok** (entity["company","TikTok","short video platform"])  
Permite embed: **Sí**. Su documentación remarca que el embed **da atribución** (creador, descripción, sonido) y linkea al contenido original; y que podés generar el markup vía **oEmbed API**. citeturn6view6  
Condiciones legales principales: embeber debe preservar atribución y vínculo al contenido (beneficio explícito del player). citeturn6view6  
Requisitos técnicos: usar el blockquote + `https://www.tiktok.com/embed.js` o consumir oEmbed para obtener el HTML. citeturn6view6  
Limitaciones prácticas: dependés de JS third-party; algunos bloqueadores rompen el render.  
Snippet (markup de ejemplo documentado):

```html
<blockquote
  class="tiktok-embed"
  cite="https://www.tiktok.com/@user/video/VIDEO_ID"
  data-video-id="VIDEO_ID"
  style="max-width: 605px;min-width: 325px;"
>
  <section></section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>

<p class="credit">
  Fuente: TikTok ·
  <a
    href="https://www.tiktok.com/@user/video/VIDEO_ID"
    target="_blank"
    rel="noopener"
    >Ver en TikTok</a
  >
</p>
```

Links oficiales:

```text
https://developers.tiktok.com/doc/embed-videos/
```

**Instagram Video** (entity["company","Instagram","social network"])  
Permite embed: **Sí (si el perfil/contenido es público)**. El Help Center indica que si la cuenta es pública, cualquiera puede embeber posts, reels, guides o el perfil. citeturn5search1turn5search5  
Condiciones legales principales: solo contenido público; además, si usás el camino “programático” (oEmbed/Meta), puede requerir tokens/feature habilitada. citeturn1search2turn1search16turn5search1  
Requisitos técnicos: copiar el embed desde Instagram (Share → Embed) o usar oEmbed (si implementás fetch server-side). citeturn5search1turn1search2  
Limitaciones prácticas: alto impacto de bloqueadores; cambios frecuentes en oEmbed/permissions. citeturn1search7turn1search16  
Snippet (patrón de “copiar código”; recomendado obtenerlo del post real para exactitud):

```html
<!-- Recomendación: pegar aquí el código que Instagram entrega en “Embed” para ese post -->
<div class="ig-embed">
  <!-- placeholder: insertar código oficial de Instagram -->
</div>

<p class="credit">
  Fuente: Instagram ·
  <a href="URL_DEL_POST" target="_blank" rel="noopener">Ver en Instagram</a>
</p>
```

Links oficiales:

```text
https://help.instagram.com/620154495870484
https://developers.facebook.com/docs/instagram-platform/oembed/
https://developers.facebook.com/docs/features-reference/oembed-read/
```

**Rumble** (entity["company","Rumble","video platform"])  
Permite embed: **Sí** vía iframe; las páginas de video muestran “Embed Code” con `rumble.com/embed/...`. citeturn4search11turn4search0  
Condiciones legales principales: usar el código provisto por la plataforma (y no intentar rehostear).  
Requisitos técnicos: iframe directo. citeturn4search11  
Limitaciones prácticas: contenido premium puede no ser accesible sin suscripción; por lo tanto el embed puede no reproducir según el usuario. citeturn4search8  
Snippet (ejemplo real de “Embed Code” visto en una página de Rumble):

```html
<iframe
  class="rumble"
  width="640"
  height="360"
  src="https://rumble.com/embed/VIDEO_ID/?pub=PUB_ID"
  frameborder="0"
  allowfullscreen
  loading="lazy"
>
</iframe>

<p class="credit">
  Fuente: Rumble ·
  <a href="https://rumble.com/VIDEO_PAGE.html" target="_blank" rel="noopener"
    >Ver en Rumble</a
  >
</p>
```

Links oficiales (punto de partida):

```text
https://rumble.com/v1a59rb-rumble-basics-how-to-embed-your-video.html
```

**Odysee** (entity["company","Odysee","video platform"])  
Permite embed: **Sí** (documentado con iframe). citeturn3search1  
Condiciones legales principales: el iframe solo inserta el reproductor; no cambia titularidad/derechos.  
Requisitos técnicos: iframe con `COPIED_EMBED_URL` (según doc). citeturn3search1  
Limitaciones prácticas: algunos entornos requieren ajustar atributos del iframe; siempre acompañar con link-out.  
Snippet (según doc):

```html
<iframe src="COPIED_EMBED_URL" allowfullscreen loading="lazy">
  <p>Tu navegador no soporta iframes. Abrí el video en la plataforma.</p>
</iframe>

<p class="credit">
  Fuente: Odysee ·
  <a href="ODYSEE_PAGE_URL" target="_blank" rel="noopener">Ver en Odysee</a>
</p>
```

Links oficiales:

```text
https://docs.odyssey.stream/embed-in-a-website/enable-embedding
```

## Snippets reutilizables para fallbacks, placeholders y consentimiento

Estos patrones están pensados para que un dev los copie y los adapte, manteniendo siempre: **crédito visible + link al origen + aviso de terceros**.

### Placeholder con “click to load” (reduce cookies y mejora performance)

```html
<div
  class="embed-shell"
  data-embed-src="IFRAME_SRC_REAL"
  data-platform="YouTube"
>
  <img src="THUMB.jpg" alt="Reproducir video" loading="lazy" />
  <button type="button" class="embed-cta">▶ Reproducir</button>
  <p class="credit">
    Contenido de terceros. Al reproducir, se carga el player externo.
  </p>
</div>

<script>
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.embed-cta');
    if (!btn) return;
    const shell = btn.closest('.embed-shell');
    const src = shell.dataset.embedSrc;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '640';
    iframe.height = '360';
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.setAttribute(
      'allow',
      'autoplay; fullscreen; picture-in-picture; encrypted-media'
    );

    shell.innerHTML = '';
    shell.appendChild(iframe);
  });
</script>
```

### Fallback universal visible (por error, geobloqueo, edad, premium, embed deshabilitado)

Como no podés inspeccionar el error interno del player por CORS/origen cruzado, lo más robusto es: **mostrar siempre** un link-out abajo del embed y un texto “si no lo ves…”.

```html
<div class="embed-footer">
  <p class="embed-note">
    Si el video no se reproduce acá (restricción de región/edad o embed
    deshabilitado), abrilo en la plataforma:
    <a href="ORIGIN_URL" target="_blank" rel="noopener">Ver en origen</a>.
  </p>
</div>
```

### Tarjeta “imagen + play” que abre en nueva pestaña (para OTT o No-Embed)

```html
<a class="video-card" href="ORIGIN_URL" target="_blank" rel="noopener">
  <img src="POSTER.jpg" alt="Abrir en plataforma" loading="lazy" />
  <span class="play-badge">▶ Ver en plataforma</span>
</a>
<p class="credit">
  Contenido de terceros. No se embeberán episodios cuando la plataforma no lo
  permita.
</p>
```

## Checklist legal y operativa para publicar embeds en mundobl.win

Este checklist está alineado con lo que documentan plataformas con embed (YouTube/Vimeo/Dailymotion/Twitch/TikTok/Bilibili) y con lo que restringen OTT (Viki/WeTV/GagaOOLala). citeturn11view5turn11view3turn6view7turn11view2turn6view6turn4search3turn10view0turn6view3turn6view8

**Verificación previa (por video):**

- Confirmar que el video es **oficial o autorizado** (ideal: canal oficial/productora/creador con derechos).
- Confirmar que el video **permite embedding** (ej.: en YouTube el uploader puede desactivar “Allow embedding”). citeturn11view5
- Testear en ventana incógnito + VPN básica (si podés) para detectar restricciones de edad/región/premium; en YouTube, videos con restricción de edad suelen fallar en embeds. citeturn11view5

**Implementación (frontend):**

- Siempre mostrar **crédito visible** debajo o al costado del player: “Fuente: [plataforma]” + link “Ver en origen”.
- No ocultar ni alterar marcas/atribuciones del reproductor (ej.: no “taparlo” con overlays permanentes).
- Usar `loading="lazy"` y, si corresponde, “click to load” para minimizar requests/cookies antes de consentimiento.
- Para YouTube: usar `youtube-nocookie.com` por defecto (modo de privacidad mejorada documentado). citeturn11view5
- Para Twitch: configurar `parent` con `mundobl.win` y variantes de dominio requeridas. citeturn11view2

**Políticas/ToS (cumplimiento):**

- No embeber OTT cuando los términos prohíben framing/linking no autorizado (Viki) o prohíben incorporar la plataforma en otro producto (WeTV). citeturn10view0turn6view3
- Tratar GagaOOLala como link-out: sus términos refuerzan uso personal y prohíben replicar/stream público/proveer a terceros “in any other way”. citeturn6view8

**Fallbacks y UX resistente:**

- Mostrar siempre el mensaje “Si no se ve, abrir en origen” debajo del embed.
- Mantener un modo “solo link-out” configurable por plataforma.
- Registrar métricas internas sin scraping (ej.: clicks en “Ver en origen”). Eso te permite optimizar qué plataformas funcionan mejor para tu audiencia.

**Aviso legal recomendado (visible en el sitio):**

- “Los videos mostrados pertenecen a terceros. mundobl.win solo integra reproductores oficiales o enlaces al contenido original. Si sos titular de derechos y querés que retiremos un embed/enlace, contactanos.”
