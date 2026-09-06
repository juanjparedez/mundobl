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
