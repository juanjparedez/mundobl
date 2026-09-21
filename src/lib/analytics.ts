import { track } from '@vercel/analytics';

/** Valores admitidos en las props de un evento. Escalares a proposito:
 *  nada de objetos anidados donde se pueda colar informacion de usuario
 *  sin querer. */
type EventProps = Record<string, string | number | boolean | null>;

/**
 * Evento custom de Vercel Web Analytics.
 *
 * REGLA: solo se instrumenta lo que las pageviews NO pueden responder, y
 * solo con datos NO personales. Nada de ids de usuario, emails, titulos de
 * series que el usuario marco como privadas, ni contenido de notas o
 * comentarios. Las pageviews ya cubren "que paginas se visitan"; los
 * eventos son para decisiones concretas que no se leen del trafico.
 *
 * Ademas hay un limite de eventos en la capa gratuita, asi que cada evento
 * nuevo tiene que justificar su costo: si no cambia una decision, no va.
 *
 * `track` de Vercel ya es no-op fuera de produccion y fuera de Vercel, asi
 * que en dev y en local esto no manda nada.
 */
export function trackEvent(name: string, props?: EventProps): void {
  try {
    track(name, props);
  } catch {
    // La medicion nunca puede romper la app.
  }
}

/**
 * Eventos de embudo de activacion/retencion (ver docs/plan-maestro-retencion).
 * Nombres y props fijos a proposito, tipados por evento: nadie escribe el
 * nombre a mano y usar uno que no este en el catalogo no compila.
 */
export type FunnelEvent =
  | 'episode_marked'
  | 'series_status_set'
  | 'track_cta_click'
  | 'onboarding_step';

interface FunnelEventProps {
  episode_marked: {
    source: 'list' | 'stepper' | 'watching' | 'onboarding';
    status: 'VISTA' | 'SIN_VER';
  };
  series_status_set: {
    status: 'VIENDO' | 'VISTA' | 'ABANDONADA' | 'RETOMAR' | 'SIN_VER';
    source: 'toggle' | 'watching' | 'auto';
  };
  track_cta_click: { where: 'series_anon' | 'home' };
  onboarding_step: { step: 1 | 2 | 3 | 'done' | 'skip' };
}

export function trackFunnel<E extends FunnelEvent>(
  event: E,
  props: FunnelEventProps[E]
): void {
  trackEvent(event, props as EventProps);
}
