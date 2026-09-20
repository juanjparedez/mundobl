# T24 — Página "Cómo se sostiene MundoBL"

**Fase:** 4 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** pedir apoyo de la única forma coherente con el proyecto: contando la verdad y sin pedirlo dos veces. Nunca modal, nunca paywall, nunca en el onboarding.

## Ruta

`/apoyar` (server, indexable). Contenido en i18n (bloque `support`):

1. Qué es MundoBL y quién lo hace (dos personas, sin empresa detrás).
2. **Qué cuesta por mes**, en números reales y actualizables desde `src/data/community-support.ts` (agregar `monthlyCosts: Array<{ label, usd }>`: Vercel, Supabase, Cloudflare R2, dominio, Resend). Mostrar el total.
3. **Qué no vamos a hacer nunca**: suscripciones, paywall, vender datos, publicidad invasiva.
4. Links de apoyo que ya existen en `community-support.ts` (Cafecito, Ko-fi) como `ActionCard`.
5. Otras formas de ayudar sin plata: colaborar con series (`/admin/colaborador` vía rol), sugerir correcciones, compartir.

## Dónde se enlaza (y dónde no)

- Sí: pie de `/watching` (una línea de texto, `t('support.footerLine')` "MundoBL es gratis y lo mantienen dos personas · Cómo ayudar"), pie del digest semanal (una línea), `/acerca`, y el `Popconfirm` de "Terminé la serie" (T06/T08) muestra debajo del éxito **una vez cada 30 días** (`localStorage['mundobl.supportHintAt']`) el mismo texto.
- No: home, onboarding, ficha de serie, ningún modal.

## Transparencia (opcional, si Juan quiere cargar el dato)

Campo `monthlyContributionsUsd` en `community-support.ts` actualizado a mano → "Este mes se cubrió el {pct} % de la infra". Si el campo está en `null`, no se muestra nada.

## Criterios de aceptación

- [ ] La página existe en 10 idiomas y lista costos reales (Juan los completa en el archivo de datos).
- [ ] La línea de apoyo aparece en el pie de `/watching` y no en la home ni en la ficha.
- [ ] El recordatorio tras "Terminé la serie" no aparece más de una vez cada 30 días.
