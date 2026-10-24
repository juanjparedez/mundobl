/**
 * "Que estas viendo?" del primer ingreso.
 *
 * Por que existe (medido el 2026-10-24): 57% de las cuentas nunca hizo nada
 * despues de registrarse (72% de las de octubre), y de quienes alguna vez
 * marcaron una serie, 72 de 79 lo hicieron en su primera hora. Si no sigue
 * algo en la primera visita, casi nunca vuelve. El modal le pide eso de
 * entrada: elegir series al aire y por que capitulo va.
 *
 * Seguir una serie ya la suscribe a sus avisos (subscribeOnFirstTrack), asi
 * que cada eleccion es tambien un motivo para volver.
 */

import { ONBOARDING_MAX_PICKS } from '@/constants/onboarding';
import { prisma, filterOnboardingSeriesIds } from './database';
import {
  ProgressNotFoundError,
  setProgress,
  setSeriesTrackingStatus,
} from './tracking';

export interface OnboardingPick {
  seriesId: number;
  /** Capitulo de la ultima temporada por el que va. Null = recien empieza. */
  seasonNumber: number | null;
  episodeNumber: number | null;
}

export class OnboardingInputError extends Error {}

/** Valida el body del POST. Tira OnboardingInputError si no sirve. */
export function parseOnboardingPicks(raw: unknown): OnboardingPick[] {
  if (!Array.isArray(raw)) throw new OnboardingInputError('picks inválido');
  if (raw.length > ONBOARDING_MAX_PICKS) {
    throw new OnboardingInputError('Demasiadas series');
  }

  const seen = new Set<number>();
  return raw.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      throw new OnboardingInputError('pick inválido');
    }
    const { seriesId, seasonNumber, episodeNumber } = item as Record<
      string,
      unknown
    >;
    if (!Number.isInteger(seriesId) || seen.has(seriesId as number)) {
      throw new OnboardingInputError('seriesId inválido');
    }
    seen.add(seriesId as number);

    const hasEpisode = episodeNumber !== null && episodeNumber !== undefined;
    if (
      hasEpisode &&
      (!Number.isInteger(episodeNumber) ||
        (episodeNumber as number) < 1 ||
        !Number.isInteger(seasonNumber))
    ) {
      throw new OnboardingInputError('episodio inválido');
    }

    return {
      seriesId: seriesId as number,
      seasonNumber: hasEpisode ? (seasonNumber as number) : null,
      episodeNumber: hasEpisode ? (episodeNumber as number) : null,
    };
  });
}

/**
 * Aplica las elecciones (puede ser ninguna: "Ahora no") y cierra el modal
 * para siempre. Las series que ya no estan al aire se ignoran en silencio:
 * el modal pudo quedar abierto de un dia para el otro.
 */
export async function completeOnboarding(
  userId: string,
  picks: OnboardingPick[]
): Promise<{ followed: number }> {
  const allowed = new Set(
    picks.length > 0
      ? await filterOnboardingSeriesIds(picks.map((pick) => pick.seriesId))
      : []
  );
  const valid = picks.filter((pick) => allowed.has(pick.seriesId));

  await prisma.$transaction(async (tx) => {
    for (const pick of valid) {
      await setSeriesTrackingStatus(tx, userId, pick.seriesId, 'VIENDO');
      if (pick.seasonNumber === null || pick.episodeNumber === null) continue;
      try {
        await setProgress(tx, userId, pick.seriesId, {
          seasonNumber: pick.seasonNumber,
          episodeNumber: pick.episodeNumber,
        });
      } catch (error) {
        // Episodio que ya no existe: queda en VIENDO sin progreso, que es
        // mejor que perder la eleccion entera.
        if (!(error instanceof ProgressNotFoundError)) throw error;
      }
    }
    await tx.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  });

  return { followed: valid.length };
}
