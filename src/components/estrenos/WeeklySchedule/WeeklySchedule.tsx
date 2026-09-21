'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Chip, MediaCard } from '@/components/design-system';
import { cardImageUrl, isDirectServedImageUrl } from '@/lib/image-helpers';
import { getSeriesUrl } from '@/lib/slug';
import { groupByWeekday } from '@/lib/airing-schedule';
import type { AiringScheduleRow } from '@/lib/database';
import './WeeklySchedule.css';

export interface WeeklyScheduleLabels {
  /** Nombres de los 7 dias, indexados 0 = domingo .. 6 = sabado. */
  weekdays: readonly [string, string, string, string, string, string, string];
  today: string;
  /** Template con `{count}`, ej. "+{count} más". */
  moreCount: string;
  emptyDay: string;
}

export interface WeeklyScheduleProps {
  rows: readonly AiringScheduleRow[];
  labels: WeeklyScheduleLabels;
  /** Cuantas series mostrar por dia antes de cortar con "+N". Sin tope si se omite. */
  maxPerDay?: number;
  /** Slot por serie (la campanita de suscripcion). Recibe el id. */
  renderCardAction?: (seriesId: number) => ReactNode;
}

/**
 * Parrilla semanal de emision: una columna por dia, las series que salen ese dia.
 *
 * Por que el dia de hoy se calcula despues del mount y no en el servidor: la pagina
 * se sirve con ISR (revalidate de 300 s en la landing, 3600 s en /estrenos) y Vercel
 * corre en UTC. Calcular "hoy" del lado del servidor da mal para un visitante
 * argentino despues de las 21:00 y, peor, queda CONGELADO en el cache: todos los
 * visitantes de la proxima hora verian el dia que era cuando se genero la pagina.
 *
 * Entonces el SSR renderiza siempre lunes -> domingo, sin marca de hoy, y un efecto
 * post-mount rota el orden y pinta el chip con el dia real del visitante. Cero
 * mismatch de hidratacion y cero cache day-aware.
 */
/** Centinela: el servidor no sabe en que dia esta el visitante. */
const UNKNOWN_WEEKDAY = -1;

/** El dia no cambia durante la sesion; no hay nada a que suscribirse. */
const subscribeToNothing = () => () => {};
const getClientWeekday = () => new Date().getDay();
const getServerWeekday = () => UNKNOWN_WEEKDAY;

export function WeeklySchedule({
  rows,
  labels,
  maxPerDay,
  renderCardAction,
}: WeeklyScheduleProps) {
  // `useSyncExternalStore` es exactamente la herramienta para "el snapshot del
  // servidor no es el del cliente": React usa `getServerSnapshot` para el SSR y
  // la hidratacion, y recien despues vuelve a renderizar con el valor real del
  // visitante. Sin warning de mismatch y sin setState dentro de un efecto.
  const todayWeekday = useSyncExternalStore(
    subscribeToNothing,
    getClientWeekday,
    getServerWeekday
  );

  // Sin dia del visitante todavia (SSR y primer render): semana fija lunes -> domingo.
  const startWeekday = todayWeekday === UNKNOWN_WEEKDAY ? 1 : todayWeekday;

  const days = useMemo(
    () => groupByWeekday(rows, startWeekday),
    [rows, startWeekday]
  );

  return (
    <div className="weekly-schedule">
      {days.map(({ weekday, series }) => {
        const isToday =
          todayWeekday !== UNKNOWN_WEEKDAY && weekday === todayWeekday;
        const visible =
          maxPerDay !== undefined ? series.slice(0, maxPerDay) : series;
        const hidden = series.length - visible.length;

        return (
          <section
            key={weekday}
            className={`weekly-schedule__day${
              isToday ? ' weekly-schedule__day--today' : ''
            }`}
            aria-label={labels.weekdays[weekday]}
          >
            <header className="weekly-schedule__day-head">
              <span className="weekly-schedule__day-name">
                {labels.weekdays[weekday]}
              </span>
              {isToday && (
                <Chip tone="accent" size="sm">
                  {labels.today}
                </Chip>
              )}
            </header>

            {series.length === 0 ? (
              <p className="weekly-schedule__day-empty">{labels.emptyDay}</p>
            ) : (
              <ul className="weekly-schedule__list">
                {visible.map((serie) => (
                  <li key={serie.id} className="weekly-schedule__item">
                    <MediaCard
                      href={getSeriesUrl(serie.id, serie.title)}
                      imageUrl={cardImageUrl(serie)}
                      unoptimizedImage={isDirectServedImageUrl(
                        cardImageUrl(serie)
                      )}
                      imageAlt={serie.title}
                      title={serie.title}
                      subtitle={
                        [
                          serie.year ? String(serie.year) : null,
                          serie.country?.name ?? null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || undefined
                      }
                      aspectRatio="2:3"
                      actions={renderCardAction?.(serie.id)}
                      className="weekly-schedule__card"
                    />
                  </li>
                ))}
                {hidden > 0 && (
                  <li className="weekly-schedule__more">
                    {labels.moreCount.replace('{count}', String(hidden))}
                  </li>
                )}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
