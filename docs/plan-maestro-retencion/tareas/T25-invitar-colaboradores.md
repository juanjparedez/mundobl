# T25 — Invitar colaboradores entre los trackers activos

**Fase:** 4 · **Esfuerzo:** S · **Depende de:** T02 · **Tarea manual de Juan/Flor, no de código** (salvo el punto 1).

## Por qué

El pipeline de colaboradores está completo (rol `COLLABORATOR`, importador desde YouTube, panel `/admin/colaborador`, guía, soporte) y tiene 2 personas. Los mejores candidatos ya están en la base: los usuarios con más filas de `ViewStatus` que no son admin (hoy hay 8 con más de 10).

## Pasos

1. **Código (S):** en `/admin/usuarios`, columna "Series trackeadas" y orden por esa columna, más un filtro "≥ 10". Endpoint: extender el que ya alimenta esa página con `_count` de `viewStatuses` filtrado a `seriesId not null`.
2. Flor elige 3 a 5 personas y les escribe **una por una** (email personal desde la cuenta del proyecto, no masivo): qué es ser colaborador, qué pueden hacer (`/admin/colaborador/guia`), que no hay obligación.
3. A quien acepte: asignar rol desde `/admin/usuarios`, mandar el link a la guía, y agendar un "¿cómo te fue?" a las dos semanas (soporte en `/admin/colaborador/soporte`).
4. Registrar en `docs/` fecha, cuántos se invitaron y cuántos aceptaron.

## Criterios de aceptación

- [ ] Columna y filtro funcionando en `/admin/usuarios`.
- [ ] Al menos 3 invitaciones enviadas y anotadas.
