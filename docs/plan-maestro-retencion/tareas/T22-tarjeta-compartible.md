# T22 — Tarjeta compartible "voy por el 5/12"

**Fase:** 3 · **Esfuerzo:** M · **Depende de:** T06
**Objetivo:** el único canal de adquisición que no depende de Google. El fandom BL vive en TikTok, Twitter e Instagram; una imagen linda con el progreso es lo que se comparte.

## Generación

Ruta `GET /api/og/progress?seriesId=&watched=&total=&title=` con `ImageResponse` de `next/og` (ya viene con Next 16, sin dependencia nueva). 1080×1350 (formato story/feed). Póster de la serie a la izquierda (desde `imageUrl`, mismos hosts permitidos que `images.remotePatterns`), título, "Voy por el {watched} de {total}", barra de progreso, marca "mundobl.com.ar" abajo. Sin datos del usuario en la imagen ni en la URL (el usuario elige compartir su propio progreso; la URL no lo identifica). Cachear con `Cache-Control: public, max-age=86400`.

Colores: usar los tokens de `src/styles/variables.css` copiados como constantes en un archivo `src/lib/og-theme.ts` (el OG no puede leer CSS). Es la única excepción documentada a "cero hex".

## UI

Botón "Compartir mi progreso" en `WatchProgressStepper` (T06) y en cada card de `/watching`: abre `PanelModal` con la imagen previsualizada, y dos acciones: **Compartir** (`navigator.share({ files })` cuando está disponible, si no descarga el PNG) y **Copiar link** a la ficha con `?utm_source=share&utm_medium=progress_card`. Reusar `ShareButton` de `src/components/common/ShareButton/` si ya resuelve `navigator.share`.

Analytics (extender la union de T01 con un solo evento nuevo): `progress_shared { method: 'share' | 'download' | 'copy' }`.

## Versión "mi mes"

Segunda tarjeta `GET /api/og/month?…` con "En {mes} vi {n} episodios de {m} series" usando los mismos datos que `ProfileStatsStrip`. Botón en `/perfil`. Misma mecánica.

## Criterios de aceptación

- [ ] La imagen se genera en < 1 s y se ve bien a 1080×1350.
- [ ] En Android Chrome `navigator.share` abre la hoja nativa con la imagen; en desktop descarga.
- [ ] La URL de la imagen no contiene ids de usuario.
- [ ] Vercel Analytics muestra visitas con `utm_source=share` (dimensión `utmSource`).
