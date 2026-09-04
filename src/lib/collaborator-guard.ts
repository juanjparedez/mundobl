// ============================================
// Guard de ownership para el rol COLLABORATOR
// ============================================
//
// Varios endpoints (info-blocks, /api/colaborador/series/[id], borrado de
// aportes) son compartidos entre ADMIN (sin restriccion) y COLLABORATOR
// (solo puede tocar SU PROPIO aporte USER_EMBED). Este helper centraliza
// ese chequeo — usar siempre despues de `requireRole(['ADMIN', 'COLLABORATOR'])`.

import { prisma } from './database';
import type { Role } from '@/generated/prisma';

export interface OwnershipOk {
  ok: true;
}

export interface OwnershipFail {
  ok: false;
  status: number;
  error: string;
}

export type OwnershipResult = OwnershipOk | OwnershipFail;

interface AuthLike {
  role: Role;
  userId: string;
}

/**
 * Autoriza una mutacion sobre una Series: ADMIN/MODERATOR pasan siempre
 * (mismo comportamiento que tenian estos endpoints antes de existir
 * COLLABORATOR), COLLABORATOR solo si la serie es un aporte USER_EMBED
 * propio.
 */
export async function assertSeriesOwnership(
  seriesId: number,
  auth: AuthLike
): Promise<OwnershipResult> {
  if (auth.role === 'ADMIN' || auth.role === 'MODERATOR') return { ok: true };

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { origin: true, submittedById: true },
  });
  if (!series) {
    return { ok: false, status: 404, error: 'Serie no encontrada.' };
  }
  if (series.origin !== 'USER_EMBED' || series.submittedById !== auth.userId) {
    return {
      ok: false,
      status: 403,
      error: 'No podés modificar esta serie.',
    };
  }
  return { ok: true };
}

/**
 * Igual que assertSeriesOwnership, pero para endpoints que reciben el ID
 * de un SeriesInfoBlock en vez del ID de la Series (resuelve el seriesId
 * primero).
 */
export async function assertInfoBlockOwnership(
  blockId: number,
  auth: AuthLike
): Promise<OwnershipResult> {
  if (auth.role === 'ADMIN') return { ok: true };

  const block = await prisma.seriesInfoBlock.findUnique({
    where: { id: blockId },
    select: { seriesId: true },
  });
  if (!block) {
    return { ok: false, status: 404, error: 'Bloque no encontrado.' };
  }
  return assertSeriesOwnership(block.seriesId, auth);
}
