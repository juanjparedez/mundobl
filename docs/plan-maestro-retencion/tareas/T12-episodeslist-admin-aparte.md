# T12 — Separar acciones admin en EpisodesList

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** T06
**Objetivo:** que la lista de episodios para un usuario común sea solo "ver / marcar / nota / comentarios". Hoy la misma tabla mezcla selección múltiple, borrado masivo y generación de episodios (solo admin) con los checks del usuario.

## Contexto

`src/components/series/EpisodesList.tsx` (783 líneas). `canEdit` ya gatea los botones de admin (líneas ~386, ~452, ~590), pero la cabecera con `Checkbox` "seleccionar todos" y las acciones masivas de marcar visto/no visto se muestran a todos.

## Cambios

1. **Usuario común (`!canEdit`)**: quitar la fila de cabecera con checkbox y acciones masivas. Marcar visto/no visto por episodio queda como está (T06 cubre el masivo con el stepper). Sin selección múltiple.
2. **Admin (`canEdit`)**: mover "seleccionar todos", borrar seleccionados, generar episodios y "+ episodio" a un `Collapse` cerrado por defecto titulado `t('episodesList.adminTools')`, arriba de la lista. Las acciones masivas de marcar visto/no visto se quedan ahí adentro también (siguen siendo útiles para Flor).
3. Extraer ese bloque a `src/components/series/EpisodesAdminToolbar/EpisodesAdminToolbar.tsx` + `.css` recibiendo por props los handlers existentes (no duplicar lógica).
4. En cada fila del usuario común: check de visto → ícono de nota → ícono de comentarios. Nada más. Verificar que el check tenga ≥ 44 px de área táctil en móvil.

## i18n

`episodesList.adminTools` ("Herramientas de edición").

## Criterios de aceptación

- [ ] Visitante logueado: no ve checkbox de selección ni botones masivos; marca un episodio con un toque.
- [ ] Admin: ve el `Collapse` cerrado; al abrirlo tiene exactamente las mismas acciones que antes.
- [ ] `EpisodesList.tsx` baja de tamaño (la toolbar vive en su componente).
- [ ] type-check, lint, build; 10 locales.
