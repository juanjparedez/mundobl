# T23 — Perfil público opt-in

**Fase:** 3 · **Esfuerzo:** L · **Depende de:** T22
**Objetivo:** que la comunidad deje de ser "comentarios sueltos" y pase a ser gente. Estrictamente opt-in; por defecto todo sigue privado (`/perfil` es `noindex`).

## Modelo

Migración `add_user_public_profile`: en `User`, `publicSlug String? @unique`, `isPublic Boolean @default(false)`, `publicBio String?`. Sin tabla nueva.

## Ruta

`/u/[slug]` (server, ISR 15 min, `noindex` **solo** si `isPublic` es false → 404). Muestra: nickname/`formatPublicName`, avatar, bio, "viendo ahora" (títulos con progreso), "últimas terminadas", stats simples (series vistas, episodios marcados). **Nunca** notas privadas, ratings ni favoritos salvo que el usuario active cada bloque (`publicSections String[]` en la misma migración: `'watching' | 'completed' | 'stats'`).

## Preferencias

En `ProfileSettings`: `Switch` "Perfil público", input de slug (validar `^[a-z0-9-]{3,30}$`, unicidad), `Checkbox.Group` de secciones, vista previa con link. `PATCH /api/user/me` extiende el body.

## Seguir usuarios (mínimo)

Tabla `UserFollow (followerId, followingId, createdAt)` con `@@unique` y RLS. Botón "Seguir" en `/u/[slug]`. Única consecuencia por ahora: en `/watching`, un bloque discreto "Gente que seguís está viendo…" (títulos, sin episodios). Sin notificaciones de follow en esta tarea.

## Criterios de aceptación

- [ ] Usuario sin activar nada: `/u/lo-que-sea` da 404 y nada suyo aparece en ningún lado.
- [ ] Activar con slug → página pública visible sin sesión con solo las secciones elegidas.
- [ ] Desactivar → 404 inmediato tras revalidación (`revalidatePath`).
- [ ] RLS en `UserFollow`.
