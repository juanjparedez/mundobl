# T09 — Home centrada en el tracker

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** la home recibe ~1.300 visitantes/mes y hoy vende "RESEÑAS · 10 IDIOMAS" (hay 0 reseñas). Tiene que vender lo que funciona: seguir series episodio por episodio.

## Contexto

- `src/app/page.tsx`: Server Component ISR (revalidate 5 min), calcula stats con `prisma` y renderiza `<LandingPage …>`. **No** llamar `auth()` acá.
- `src/app/LandingPage/LandingPage.tsx`: hero con `t('landing.heroBadge')` (línea ~258) y `t('landing.subtitle')` (~261); grillas de features y "novedades" con keys `landing.feature*` y `landing.novedad*`.
- Login desde la landing: `signIn('google', { callbackUrl: ROUTES.CATALOGO })` (línea ~280).

## Cambios de copy (solo `es` y `en` acá; el resto vía script)

| Key                        | Nuevo valor `es`                                                                 |
| -------------------------- | -------------------------------------------------------------------------------- |
| `landing.heroBadge`        | "Tu tracker de series BL"                                                        |
| `landing.subtitle`         | "Marcá por qué episodio vas, mirá qué te falta y enterate cuando sale el siguiente." |
| `landing.ctaPrimary` (nueva) | "Empezar a seguir mis series"                                                  |
| `landing.ctaSecondary` (nueva) | "Explorar el catálogo"                                                       |
| `landing.statEpisodesWeek` (nueva) | "episodios marcados esta semana"                                         |

El botón primario del hero pasa a ser **login** (`signIn('google', { callbackUrl: '/watching' })`) con `trackFunnel('track_cta_click', { where: 'home' })`; "Explorar catálogo" pasa a secundario. Si hay sesión, el primario dice `t('landing.ctaGoWatching')` "Ir a mis series" y lleva a `/watching` (T10 igual redirige, esto es el fallback visible).

## Stat nueva

En `page.tsx`, agregar al `Promise.all`:

```ts
prisma.viewStatus.count({
  where: { status: 'VISTA', episodeId: { not: null }, updatedAt: { gte: sevenDaysAgo } },
})
```

y mostrarla como primera `StatCard` del bloque de stats con `landing.statEpisodesWeek`. Si es 0 (semana muy tranquila), mostrar en su lugar el total histórico con `landing.statEpisodesTotal` "episodios marcados".

## Orden de secciones

1. Hero (badge + título + subtítulo + dos botones).
2. Stats (episodios esta semana, series, usuarios siguiendo algo = `count(distinct userId)` de `ViewStatus` con status VIENDO; ya hay conteos parecidos en el archivo).
3. **Cómo funciona** (nuevo, 3 pasos con íconos, keys `landing.how1..3Title/Desc`): "Buscá la serie" → "Marcá por qué episodio vas" → "Volvé cuando salga el siguiente". Usar `ActionCard` o el mismo grid de features.
4. Features existentes (dejar, pero mover "tracking" al primer lugar del array).
5. Novedades: quitar la de reseñas (`novedadReviews*`) mientras `reviews === 0`; dejar spoiler y notas.

## Criterios de aceptación

- [ ] En móvil, el título, el subtítulo y el botón primario entran en la primera pantalla.
- [ ] El primario dispara login y aterriza en `/watching`.
- [ ] La stat de episodios de la semana coincide con la query en Supabase.
- [ ] El test `e2e/smoke.spec.ts` "la landing carga y muestra contenido real" sigue pasando (`npm run test:e2e` contra dev o producción).
- [ ] type-check, lint, build; 10 locales.
