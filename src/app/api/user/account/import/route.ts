import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * POST /api/user/account/import?dryRun=true|false
 *
 * Restaura datos personales del usuario autenticado desde un JSON
 * exportado previamente por GET /api/user/account/export.
 *
 * Reglas de seguridad (todas obligatorias — ver respuesta a "Por que es
 * peligroso exportar los datos?" en la conversacion del 2026-05-11):
 *
 *  1. userId SIEMPRE viene de la sesion. Cualquier user.id / userId
 *     dentro del payload se ignora. Esto bloquea "soy el user 42" con
 *     un JSON modificado.
 *  2. Campos privilegiados se filtran: role, email, emailVerified,
 *     image, id, createdAt, updatedAt — todos los strip antes de
 *     insertar. role nunca puede escalarse via import.
 *  3. Validacion estricta del shape: schemaVersion debe ser 1; cada
 *     section debe ser array de objetos con tipos esperados; si algo
 *     no encaja se reporta y se skip ese item (no error fatal).
 *  4. Modo merge, nunca replace: solo insertar lo nuevo. Items con
 *     unique constraint usan createMany({ skipDuplicates: true });
 *     items sin unique se dedupean en codigo por (userId + contenido).
 *  5. Resolucion de FKs: si seriesId del payload no existe en este
 *     environment, skip ese item y reportar en missingRefs (en lugar
 *     de tirar 500).
 *  6. Limite de tamaño: 5MB. Por encima se rechaza con 413.
 *
 * Modo dry-run (?dryRun=true): valida y cuenta sin tocar la DB.
 * Devuelve la misma forma de respuesta para que el frontend muestre
 * preview antes de confirmar.
 *
 * Notification NO se importa: son ephemerals derivados de eventos
 * (replies, season-added, etc). Re-importar viejas no tiene sentido.
 */

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB
const SUPPORTED_SCHEMA_VERSION = 1;

interface ImportSummary {
  dryRun: boolean;
  schemaVersion: number;
  imported: Record<string, number>;
  skipped: Record<string, number>;
  missingRefs: { section: string; reason: string; ref: unknown }[];
  errors: string[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function asInt(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) ? v : null;
}

function asBool(v: unknown): boolean {
  return v === true;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  const userId = auth.userId;

  // 6. Size limit.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Payload too large (max 5MB)' },
      { status: 413 }
    );
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isObject(payload)) {
    return NextResponse.json(
      { error: 'Payload must be an object' },
      { status: 400 }
    );
  }

  // 3. Schema version.
  if (payload.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return NextResponse.json(
      {
        error: `Unsupported schemaVersion: expected ${SUPPORTED_SCHEMA_VERSION}, got ${String(payload.schemaVersion)}`,
      },
      { status: 400 }
    );
  }

  const summary: ImportSummary = {
    dryRun,
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    imported: {},
    skipped: {},
    missingRefs: [],
    errors: [],
  };

  // Series existentes en este env — para resolucion de FKs (regla 5).
  // Cacheamos los ids una sola vez en lugar de hacer N queries.
  const seriesIds = new Set(
    (await prisma.series.findMany({ select: { id: true } })).map((s) => s.id)
  );
  const featureRequestIds = new Set(
    (await prisma.featureRequest.findMany({ select: { id: true } })).map(
      (f) => f.id
    )
  );

  // ─── userRatings ─────────────────────────────────────────────────
  {
    const items = asArray<Record<string, unknown>>(payload.userRatings);
    const toInsert: {
      userId: string;
      seriesId: number;
      category: string;
      score: number;
    }[] = [];
    for (const it of items) {
      if (!isObject(it)) continue;
      const seriesId = asInt(it.seriesId);
      const category = asString(it.category);
      const score = asInt(it.score);
      if (!seriesId || !category || score === null || score < 1 || score > 10) {
        summary.errors.push(
          `userRatings: invalid item ${JSON.stringify(it).slice(0, 80)}`
        );
        continue;
      }
      if (!seriesIds.has(seriesId)) {
        summary.missingRefs.push({
          section: 'userRatings',
          reason: 'series-not-found',
          ref: { seriesId },
        });
        continue;
      }
      // 1, 2. userId siempre de la sesion; ignoramos cualquier user.id del payload.
      toInsert.push({ userId, seriesId, category, score });
    }
    if (!dryRun && toInsert.length > 0) {
      const result = await prisma.userRating.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
      summary.imported.userRatings = result.count;
      summary.skipped.userRatings = toInsert.length - result.count;
    } else {
      summary.imported.userRatings = toInsert.length;
      summary.skipped.userRatings = 0;
    }
  }

  // ─── viewStatuses ─────────────────────────────────────────────────
  {
    const items = asArray<Record<string, unknown>>(payload.viewStatuses);
    const toInsert: {
      userId: string;
      seriesId: number;
      status: 'SIN_VER' | 'VIENDO' | 'VISTA' | 'ABANDONADA' | 'RETOMAR';
      watchedDate: Date | null;
    }[] = [];
    const validStatuses = new Set([
      'SIN_VER',
      'VIENDO',
      'VISTA',
      'ABANDONADA',
      'RETOMAR',
    ]);
    for (const it of items) {
      if (!isObject(it)) continue;
      const seriesId = asInt(it.seriesId);
      const status = asString(it.status);
      if (!seriesId || !status || !validStatuses.has(status)) {
        summary.errors.push(`viewStatuses: invalid item`);
        continue;
      }
      if (!seriesIds.has(seriesId)) {
        summary.missingRefs.push({
          section: 'viewStatuses',
          reason: 'series-not-found',
          ref: { seriesId },
        });
        continue;
      }
      const watchedDate = asString(it.watchedDate);
      toInsert.push({
        userId,
        seriesId,
        status: status as
          | 'SIN_VER'
          | 'VIENDO'
          | 'VISTA'
          | 'ABANDONADA'
          | 'RETOMAR',
        watchedDate: watchedDate ? new Date(watchedDate) : null,
      });
    }
    if (!dryRun && toInsert.length > 0) {
      const result = await prisma.viewStatus.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
      summary.imported.viewStatuses = result.count;
      summary.skipped.viewStatuses = toInsert.length - result.count;
    } else {
      summary.imported.viewStatuses = toInsert.length;
      summary.skipped.viewStatuses = 0;
    }
  }

  // ─── favorites ────────────────────────────────────────────────────
  {
    const items = asArray<Record<string, unknown>>(payload.favorites);
    const toInsert: { userId: string; seriesId: number }[] = [];
    for (const it of items) {
      if (!isObject(it)) continue;
      const seriesId = asInt(it.seriesId);
      if (!seriesId) continue;
      if (!seriesIds.has(seriesId)) {
        summary.missingRefs.push({
          section: 'favorites',
          reason: 'series-not-found',
          ref: { seriesId },
        });
        continue;
      }
      toInsert.push({ userId, seriesId });
    }
    if (!dryRun && toInsert.length > 0) {
      const result = await prisma.userFavorite.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
      summary.imported.favorites = result.count;
      summary.skipped.favorites = toInsert.length - result.count;
    } else {
      summary.imported.favorites = toInsert.length;
      summary.skipped.favorites = 0;
    }
  }

  // ─── comments ─────────────────────────────────────────────────────
  // Sin unique constraint — dedupeamos por (userId, seriesId, content).
  // Solo importamos comments de serie (no season/episode), porque los
  // ids de season/episode son menos estables.
  {
    const items = asArray<Record<string, unknown>>(payload.comments);
    const existing = await prisma.comment.findMany({
      where: { userId },
      select: { seriesId: true, content: true },
    });
    const existingSet = new Set(
      existing.map((c) => `${c.seriesId}::${c.content}`)
    );
    const toInsert: {
      userId: string;
      seriesId: number;
      content: string;
      isPrivate: boolean;
    }[] = [];
    let skipped = 0;
    for (const it of items) {
      if (!isObject(it)) continue;
      const seriesId = asInt(it.seriesId);
      const content = asString(it.content);
      if (!seriesId || !content || content.length === 0) continue;
      if (!seriesIds.has(seriesId)) {
        summary.missingRefs.push({
          section: 'comments',
          reason: 'series-not-found',
          ref: { seriesId },
        });
        continue;
      }
      if (existingSet.has(`${seriesId}::${content}`)) {
        skipped++;
        continue;
      }
      toInsert.push({
        userId,
        seriesId,
        content,
        isPrivate: asBool(it.isPrivate),
      });
      existingSet.add(`${seriesId}::${content}`);
    }
    if (!dryRun && toInsert.length > 0) {
      await prisma.comment.createMany({ data: toInsert });
    }
    summary.imported.comments = toInsert.length;
    summary.skipped.comments = skipped;
  }

  // ─── featureRequests ──────────────────────────────────────────────
  // Sin unique constraint — dedupe por (userId, title).
  {
    const items = asArray<Record<string, unknown>>(payload.featureRequests);
    const existing = await prisma.featureRequest.findMany({
      where: { userId },
      select: { title: true },
    });
    const existingSet = new Set(existing.map((f) => f.title));
    const toInsert: {
      userId: string;
      title: string;
      description: string | null;
      type: string;
    }[] = [];
    let skipped = 0;
    for (const it of items) {
      if (!isObject(it)) continue;
      const title = asString(it.title);
      const type = asString(it.type);
      if (!title || !type) continue;
      if (existingSet.has(title)) {
        skipped++;
        continue;
      }
      // status/priority NO se importan: vienen del schema con default OPEN/MEDIUM.
      // Nunca permitir override desde el payload.
      toInsert.push({
        userId,
        title,
        description: asString(it.description),
        type,
      });
      existingSet.add(title);
    }
    if (!dryRun && toInsert.length > 0) {
      await prisma.featureRequest.createMany({ data: toInsert });
    }
    summary.imported.featureRequests = toInsert.length;
    summary.skipped.featureRequests = skipped;
  }

  // ─── featureVotes ─────────────────────────────────────────────────
  {
    const items = asArray<Record<string, unknown>>(payload.featureVotes);
    const toInsert: { userId: string; featureRequestId: number }[] = [];
    for (const it of items) {
      if (!isObject(it)) continue;
      const featureRequestId = asInt(it.featureRequestId);
      if (!featureRequestId) continue;
      if (!featureRequestIds.has(featureRequestId)) {
        summary.missingRefs.push({
          section: 'featureVotes',
          reason: 'feature-request-not-found',
          ref: { featureRequestId },
        });
        continue;
      }
      toInsert.push({ userId, featureRequestId });
    }
    if (!dryRun && toInsert.length > 0) {
      const result = await prisma.featureVote.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
      summary.imported.featureVotes = result.count;
      summary.skipped.featureVotes = toInsert.length - result.count;
    } else {
      summary.imported.featureVotes = toInsert.length;
      summary.skipped.featureVotes = 0;
    }
  }

  // ─── suggestedSites ───────────────────────────────────────────────
  // Sin unique constraint — dedupe por (userId, url).
  {
    const items = asArray<Record<string, unknown>>(payload.suggestedSites);
    const existing = await prisma.suggestedSite.findMany({
      where: { userId },
      select: { url: true },
    });
    const existingSet = new Set(existing.map((s) => s.url));
    const toInsert: {
      userId: string;
      name: string;
      url: string;
      description: string | null;
      category: string | null;
      language: string | null;
    }[] = [];
    let skipped = 0;
    for (const it of items) {
      if (!isObject(it)) continue;
      const name = asString(it.name);
      const itemUrl = asString(it.url);
      if (!name || !itemUrl) continue;
      if (existingSet.has(itemUrl)) {
        skipped++;
        continue;
      }
      // status/adminNote NO se importan: los setea el admin moderator.
      toInsert.push({
        userId,
        name,
        url: itemUrl,
        description: asString(it.description),
        category: asString(it.category),
        language: asString(it.language),
      });
      existingSet.add(itemUrl);
    }
    if (!dryRun && toInsert.length > 0) {
      await prisma.suggestedSite.createMany({ data: toInsert });
    }
    summary.imported.suggestedSites = toInsert.length;
    summary.skipped.suggestedSites = skipped;
  }

  return NextResponse.json(summary, { status: 200 });
}
