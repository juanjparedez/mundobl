# T26 — Póster placeholder en la ficha y en las cards

**Fase:** 1 (consistencia) · **Esfuerzo:** S · **Depende de:** nada

## Qué está mal hoy (revisión 2026-09-20)

`SeriesHeader.tsx` solo renderiza el póster cuando `imageUrl` existe (`{imageUrl && …}`), pero el grid reserva la columna igual: en las 7 series del catálogo sin imagen (ej. `Seeing double`) el título y los chips quedan desplazados a la derecha con un hueco vacío a la izquierda. En `/watching` la card de esas series también queda sin cabecera visual.

## Cambios

1. Componente `src/components/common/PosterPlaceholder/PosterPlaceholder.tsx` + `.css`: mismo tamaño/ratio que el póster (2:3), fondo con gradiente de tokens (`--bg-elevated` → `--mb-gold-soft`), el título de la serie centrado en tipografía grande y el tipo (corto/película/serie) como `Chip`. Props: `title`, `type?`, `size?: 'header' | 'card' | 'thumb'`.
2. `SeriesHeader.tsx`: cuando no hay `imageUrl`, renderizar `PosterPlaceholder` en la misma columna (y también en el backdrop, o simplemente sin backdrop). Verificar el hero móvil (póster centrado arriba).
3. `CurrentlyWatchingDashboard.tsx` y `MediaCard` del design-system: usar el mismo placeholder cuando `imageThumbUrl`/`imageUrl` faltan (revisar si `MediaCard` ya tiene fallback; si lo tiene, unificar en el nuevo componente).
4. Admin: en `/admin/series` el `CompletenessCard` ya penaliza la falta de imagen; no tocar.

## Criterios de aceptación

- [ ] `/series/<id-de-seeing-double>` muestra el título alineado igual que una ficha con póster, con un placeholder legible en el lugar del póster.
- [ ] En `/watching` y en el catálogo, ninguna card queda sin cabecera visual.
- [ ] Cero hex; tokens de `variables.css`.
- [ ] type-check, lint, build.
