# Plan de retención — MundoBL (2026-09-20)

> Objetivo: pasar de "100 registrados que no vuelven" a una base chica pero que usa el tracker todas las semanas.
> Principio: sin paywall, nunca. El sostén viene de gente que aporta porque quiere, y eso solo pasa si el producto le sirve de verdad cada semana.

---

## 1. Diagnóstico con datos (al 2026-09-20)

Fuentes: Supabase (tablas `User`, `ViewStatus`, `AccessLog`, etc.), Vercel Web Analytics (últimos 31 días), lectura del código en `main` (8675d13).

### 1.1 Embudo

| Etapa                                              | Valor (30 días)         |
| -------------------------------------------------- | ----------------------- |
| Visitantes únicos                                  | ~3.000                  |
| Pageviews                                          | ~9.000                  |
| Registros                                          | 41 (≈1,3 %)             |
| Registrados que marcaron algo alguna vez           | 49 de 102 (48 %)        |
| Usuarios con actividad de tracking en los últimos 7 días | 10                |
| Activos semanales (WAU) no-admin                   | 8 a 12, casi siempre los mismos |

### 1.2 Retención por cohorte (semana de registro → vuelven en semana 1 / 2 / 3+)

| Cohorte | Registros | Vuelven W1 | W2 | W3+ |
| ------- | --------- | ---------- | -- | --- |
| 07-13   | 11        | 2          | 0  | 1   |
| 07-27   | 10        | 0          | 0  | 0   |
| 08-17   | 14        | 2          | 1  | 1   |
| 08-24   | 11        | 1          | 0  | 0   |
| 09-07   | 12        | 0          | 0  | 0   |
| 09-14   | 9         | 0          | 0  | 0   |

**Retención semana 1: entre 0 % y 15 %. El problema no es adquisición (Google trae gente todos los días), es activación y retorno.**

### 1.3 Tracking: el fuerte, pero solo para quien lo construyó

- 5.498 filas de `ViewStatus`; **5.329 son de un solo usuario (admin)**. El resto: 54, 14, 12, 10, 9, 9, 7, y después 1 o 2 por usuario.
- El usuario típico marca una o dos cosas y no vuelve. Nadie llega a "tener su historial cargado", que es donde el tracker empieza a valer.
- Los que sí volvieron (2+ días activos) casi todos marcaron algo el día 0. El tracking es la palanca de retención correcta.

### 1.4 Comunidad: todavía no existe

| Señal                    | Valor |
| ------------------------ | ----- |
| Comentarios              | 2     |
| Reseñas                  | 0     |
| Suscripciones a series   | 0     |
| Push subscriptions       | 1     |
| Usuarios que calificaron | 3     |
| Feature requests         | 148, de 3 personas |

Hay muchísima superficie construida (reseñas, feedback, glosario, trivia, notificaciones de 21 tipos) y nadie del otro lado. Construir más comunidad ahora es sembrar en seco.

### 1.5 Dónde aterriza la gente y qué ve

- Home: 1.318 visitantes. Fichas de serie: 683 (casi todo desde Google). Catálogo: 687.
- 75 % mobile. AR, MX, PE, ES, CO, EC, CL.
- **La home vende otra cosa**: el badge del hero dice "RESEÑAS · 10 IDIOMAS" (hay 0 reseñas) y el título "Tu catálogo personal de series BL" es ambiguo. El tracking aparece recién en la tercera oración.
- **La ficha de serie es la landing real** (Google → "dónde ver X"), y ahí el tracking para un visitante anónimo es un tag pasivo "Sin ver · 0 de 8 episodios" sin ningún llamado a la acción (`ViewStatusToggle.tsx`, rama `!session?.user`).
- `/watching` es invisible sin login: nadie descubre el producto principal antes de registrarse.
- Marcar episodios es un checkbox por fila en una tabla que mezcla acciones de usuario con acciones de admin (`EpisodesList.tsx`: bulk delete, generar episodios).
- Nada trae a la gente de vuelta: el único email es el de bienvenida, no hay digest, y las suscripciones/push están en cero.

### 1.6 Lo que sí está bien y hay que aprovechar

- SEO funciona: ~1.100 visitantes/mes desde Google sin invertir.
- "1 viendo ahora" en la ficha ya es prueba social real.
- El dashboard de `/watching` ya calcula "hoy toca capítulo" desde `airDays`.
- Infra de notificaciones, email y push ya existe. Solo falta que dispare cosas que le importen al usuario.
- Pipeline de colaboradores completo (rol, importador, panel, soporte).
- Últimos 15 commits: casi todo admin, backups, migraciones. El código está sano. Es momento de girar hacia el usuario.

---

## 2. Métrica norte y metas a 90 días

**Métrica norte: usuarios que marcaron al menos un episodio en dos semanas distintas (retención de tracking W2).**

| Métrica                                    | Hoy      | Meta 90 días |
| ------------------------------------------ | -------- | ------------ |
| Retención W1 de cohortes nuevas            | 0–15 %   | 35 %         |
| Retención W2 (tracking)                    | ~5 %     | 25 %         |
| Tasa de registro (visitantes → cuenta)     | 1,3 %    | 4 %          |
| Tiempo hasta el primer episodio marcado    | sin dato | < 60 s desde el login |
| WAU no-admin                               | ~10      | 60           |
| Usuarios con ≥ 5 series trackeadas         | ~8       | 40           |

Todo lo que no mueva una de estas filas se posterga.

---

## 3. Plan por fases

### Fase 0 — Medir (semana 1, en paralelo con Fase 1)

1. Eventos en Vercel Analytics (ya existen `locale_switch` y `quick_preview_open`): agregar `signup`, `first_track`, `episode_marked`, `watching_visit`, `cta_track_anon_click`.
2. Widget "Retención" en `/admin/stats` con la query de cohortes de la sección 1.2 (semana de registro × semanas de retorno) y WAU no-admin. Sin esto, no sabemos si el resto funciona.
3. Marcar en `User` (o derivar) quién es equipo, para excluirlo de todas las métricas.

### Fase 1 — Activación: "primer episodio marcado en menos de un minuto" (semanas 1 a 3)

Es la fase que más mueve la aguja. Orden por impacto/esfuerzo.

1. **CTA de tracking para anónimos en la ficha.** Reemplazar el tag pasivo por un botón "¿La estás viendo? Marcá por dónde vas". Al tocarlo, guardar la intención (serie + episodio) en `sessionStorage`, mandar a Google login con `callbackUrl` a la misma ficha, y al volver aplicar la intención automáticamente. La persona no debería tener que repetir el gesto.
2. **"Voy por el episodio N"** en la ficha y en las cards de `/watching`: un stepper/slider que marca todos los episodios ≤ N como vistos y pone la serie en VIENDO. Botón "+1" en cada card de `/watching`. El checkbox por episodio queda como detalle, no como vía principal.
3. **Tracking como invitado** en `localStorage` (serie + episodio), con un aviso suave "iniciá sesión para no perder esto". Al loguearse, se fusiona. Deja probar el producto antes de pedir la cuenta; hoy el 98,7 % se va sin registrarse.
4. **Onboarding post-login en tres pasos** (solo si el usuario tiene 0 `ViewStatus`): "¿Qué estás viendo ahora?" (buscador) → "¿Por qué episodio vas?" → "¿Cuáles de estas ya viste?" (grilla de las 30 más populares, multi-select). Termina en `/watching` con contenido. Un `/watching` vacío es la razón número uno por la que nadie vuelve.
5. **Home reescrita alrededor del tracker.** Título tipo "Llevá la cuenta de qué BL estás viendo, por qué episodio vas y qué te falta". Badge con un dato real ("X episodios marcados esta semana", ya hay conteo en `page.tsx`). Sacar "RESEÑAS · 10 IDIOMAS". Mostrar una captura o demo del tracker sin login.
6. **Separar acciones de usuario y admin en `EpisodesList`.** Bulk delete y generar episodios solo para admin y visualmente aparte.
7. **Logueado con ≥ 1 serie en VIENDO → la home lo lleva a `/watching`.** El producto principal tiene que ser la primera pantalla.

### Fase 2 — Retorno: razones honestas para volver (semanas 3 a 6)

1. **Digest semanal por email** (opt-out claro, un link). Contenido solo derivado de los datos del usuario: "esta semana estrenan episodio X e Y de tus series", "te faltan 2 episodios para terminar Z", "hace 3 semanas que no tocás W, ¿retomar o abandonar?". Reusa `email.ts`, `airDays` y `ViewStatus`. Es el mecanismo de retención más barato que existe y hoy no hay ninguno.
2. **Episodios nuevos visibles en el tracker.** Para series en emisión, que `/watching` muestre "1 episodio nuevo desde tu última visita". Necesita fecha de emisión por episodio o derivarla de `airDays` + fecha de estreno. Auditar cuántas series en emisión tienen `airDays` cargado.
3. **Nudges de cierre y pausa** dentro de la app: "casi terminás" (a 1 o 2 episodios) y "en pausa" (VIENDO sin actividad 3 semanas) con acción de un toque (RETOMAR / ABANDONADA). Notificación interna + push si está suscripto.
4. **Pedir push e instalación PWA después del primer episodio marcado**, no antes. Hoy hay 1 suscripción push porque nunca hay un momento de valor donde pedirla.
5. **Usuarios en pausa: campaña única de reactivación** a los 60 registrados que nunca marcaron nada, con el onboarding nuevo como link. Un solo email, honesto, sin insistir.

### Fase 3 — Comunidad pegada al tracking (semanas 6 a 10)

Solo arrancar cuando la retención W1 pase del 25 %. La comunidad de MundoBL no debería ser un foro: debería ser "la gente que va por el mismo episodio que vos".

1. **Reacciones por episodio** (😭 🔥 ❤️ 😳) de un toque, agregadas y anónimas: "el episodio 7 destrozó a 34 personas". Cero fricción, imposible de manipular en serio, y da datos únicos ("episodio más llorado del año").
2. **Comentarios de episodio protegidos por progreso.** El hilo del episodio N solo se muestra completo a quien lo marcó como visto. Modo anti-spoiler por construcción, y el comentario vuelve a tener sentido porque siempre está contextualizado.
3. **Tarjeta compartible** "Estoy viendo X, voy por el 5/12" y "Mi mes en BL" (los widgets del perfil ya calculan todo). Es el único canal de adquisición que no depende de Google, y este fandom vive en TikTok y Twitter.
4. **Perfil público opt-in** con el diario de series. Recién acá tienen sentido seguir usuarios y "watch buddies".
5. **Postergar**: reseñas largas, ranking/gamificación con modelo `Achievement`, glosario en Command-K, más features del foro de feedback. Ya están construidas o documentadas; no mueven la métrica norte hoy.

### Fase 4 — Colaboradores y sostén (continuo desde la semana 4)

1. **Reclutar 3 a 5 colaboradores entre los trackers más activos** (los 8 usuarios con más de 10 filas). Invitación personal, uno por uno. El pipeline ya existe; falta gente en él.
2. **Página "Cómo se sostiene MundoBL"** con los costos reales de infra (Vercel, Supabase, R2, dominio, en números) y los links a Cafecito y Ko-fi que ya están en `community-support.ts`. Sin modal, sin nag, sin paywall. Aparece en momentos de valor: al completar una serie, al final de `/watching`, en el digest semanal.
3. **Transparencia como identidad**: "N personas aportaron este mes, cubrimos X % de la infra". Es coherente con la ética del proyecto y es lo único que hace que alguien done sin que se lo pidan.

---

## 4. Esta semana (arranque concreto)

| # | Tarea                                                     | Esfuerzo | Archivo principal                          |
| - | --------------------------------------------------------- | -------- | ------------------------------------------ |
| 1 | Hero de la home centrado en tracking, sacar badge de reseñas | 1 h   | `src/app/page.tsx`, `src/i18n/messages.ts` |
| 2 | CTA para anónimos en la ficha + intención post-login      | 3 h      | `src/components/series/ViewStatusToggle.tsx` |
| 3 | Stepper "Voy por el episodio N"                           | 4 h      | `EpisodesList.tsx`, `api/episodes/[id]/view-status` (nuevo endpoint bulk hasta N) |
| 4 | Widget de retención en `/admin/stats`                     | 2 h      | `src/app/(app)/admin/stats`, query de la sección 1.2 |
| 5 | Home → `/watching` si el usuario ya trackea               | 1 h      | `src/app/page.tsx`                         |
| 6 | Eventos de analytics del embudo                           | 1 h      | donde ya se emite `quick_preview_open`     |

Regla de reparto para las próximas seis semanas: **70 % del tiempo en Fases 1 y 2, 30 % en admin/infra/feedback**. Los últimos quince commits fueron casi todos admin y eso no cambia ninguna de las métricas de la sección 2.

---

## 5. Query de cohortes (para el widget de admin)

```sql
with act as (
  select "userId", date_trunc('week', "createdAt") wk
  from "AccessLog"
  where "userId" is not null and "createdAt" > now() - interval '16 weeks'
  group by 1, 2
), u as (
  select id, date_trunc('week', "createdAt") signup_wk
  from "User" where role <> 'ADMIN'
)
select to_char(signup_wk, 'YYYY-MM-DD') cohorte,
  count(distinct u.id) registros,
  count(distinct case when a.wk = u.signup_wk + interval '1 week' then a."userId" end) w1,
  count(distinct case when a.wk = u.signup_wk + interval '2 week' then a."userId" end) w2,
  count(distinct case when a.wk >= u.signup_wk + interval '3 week' then a."userId" end) w3_mas
from u left join act a on a."userId" = u.id
where u.signup_wk > now() - interval '14 weeks'
group by signup_wk order by signup_wk;
```

Cuando exista el evento `first_track`, cambiar `AccessLog` por `ViewStatus.updatedAt` para medir retención de tracking y no solo de visita.
