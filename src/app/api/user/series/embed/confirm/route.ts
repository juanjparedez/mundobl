import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import {
  checkOfficialYouTubeVideos,
  ONLY_YOUTUBE_ERROR,
} from '@/lib/official-content-guard';
import { prisma, getContributionMetadata } from '@/lib/database';
import { detectPlatform, extractVideoId } from '@/lib/embed-helpers';
import { checkUserEmbedRateLimit } from '@/lib/rate-limit';
import { contributionMetadataFailure } from '@/lib/contribution-metadata';
import {
  ALLOWED_COUNTRY_CODES,
  SUPPORTED_EMBED_PLATFORMS,
  type EmbedConfirmInput,
  type AllowedCountryCode,
} from '@/lib/user-embed-preview';

const ALLOWED_TYPES = ['serie', 'pelicula', 'corto', 'especial'] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

interface ParsedInput {
  url: string;
  platform: 'YouTube' | 'Vimeo' | 'Bilibili' | 'Dailymotion';
  videoId: string;
  title: string;
  originalTitle: string | null;
  year: number | null;
  type: AllowedType;
  countryCode: AllowedCountryCode | null;
  synopsis: string | null;
  actorNames: string[];
  productionCompanyName: string | null;
  originalLanguageName: string | null;
  dubbingLanguageNames: string[];
  tagNames: string[];
  genreNames: string[];
  episodeNumber: number;
  episodeTitle: string | null;
  seasonNumber: number;
  channelName: string | null;
  channelUrl: string | null;
  linkedSeriesId: number | null;
}

function parseAndValidate(
  body: EmbedConfirmInput
):
  | { ok: true; data: ParsedInput }
  | { ok: false; status: number; error: string } {
  const url = (body?.url ?? '').trim();
  if (!url) return { ok: false, status: 400, error: 'URL requerida.' };
  try {
    new URL(url);
  } catch {
    return { ok: false, status: 400, error: 'URL invalida.' };
  }
  const platform = detectPlatform(url);
  if (!platform || !SUPPORTED_EMBED_PLATFORMS.includes(platform as never)) {
    return {
      ok: false,
      status: 422,
      error: `Plataforma no soportada. Aceptamos: ${SUPPORTED_EMBED_PLATFORMS.join(', ')}.`,
    };
  }
  const videoId = extractVideoId(platform, url);
  if (!videoId) {
    return { ok: false, status: 400, error: 'No se pudo extraer el video ID.' };
  }

  const series = body.series ?? ({} as EmbedConfirmInput['series']);
  const title = (series.title ?? '').trim();
  if (!title) {
    return { ok: false, status: 400, error: 'El titulo es requerido.' };
  }
  if (title.length > 200) {
    return { ok: false, status: 400, error: 'El titulo es demasiado largo.' };
  }

  const synopsis =
    typeof series.synopsis === 'string' && series.synopsis.trim()
      ? series.synopsis.trim().slice(0, 2000)
      : null;

  const yearRaw =
    typeof series.year === 'number' ? series.year : Number(series.year ?? NaN);
  const year =
    Number.isFinite(yearRaw) && yearRaw >= 1990 && yearRaw <= 2030
      ? Math.floor(yearRaw)
      : null;

  const countryCodeRaw =
    typeof series.countryCode === 'string'
      ? series.countryCode.toUpperCase()
      : null;
  const countryCode =
    countryCodeRaw &&
    ALLOWED_COUNTRY_CODES.includes(countryCodeRaw as AllowedCountryCode)
      ? (countryCodeRaw as AllowedCountryCode)
      : null;

  const type: AllowedType = ALLOWED_TYPES.includes(series.type as AllowedType)
    ? (series.type as AllowedType)
    : 'serie';

  const linkedSeriesIdRaw =
    typeof series.linkedSeriesId === 'number'
      ? series.linkedSeriesId
      : Number(series.linkedSeriesId ?? NaN);
  const linkedSeriesId =
    Number.isFinite(linkedSeriesIdRaw) && linkedSeriesIdRaw > 0
      ? Math.floor(linkedSeriesIdRaw)
      : null;

  const episode = body.episode ?? { episodeNumber: 1 };
  const episodeNumberRaw =
    typeof episode.episodeNumber === 'number'
      ? episode.episodeNumber
      : Number(episode.episodeNumber);
  const episodeNumber =
    Number.isFinite(episodeNumberRaw) && episodeNumberRaw > 0
      ? Math.floor(episodeNumberRaw)
      : 1;
  const seasonNumberRaw =
    typeof episode.seasonNumber === 'number'
      ? episode.seasonNumber
      : Number(episode.seasonNumber);
  const seasonNumber =
    Number.isFinite(seasonNumberRaw) && seasonNumberRaw > 0
      ? Math.floor(seasonNumberRaw)
      : 1;

  return {
    ok: true,
    data: {
      url,
      platform: platform as ParsedInput['platform'],
      videoId,
      title,
      originalTitle: clean(series.originalTitle, 200),
      year,
      type,
      countryCode,
      synopsis,
      actorNames: cleanArray(series.actorNames, 8, 80),
      productionCompanyName: clean(series.productionCompanyName, 150),
      originalLanguageName: clean(series.originalLanguageName, 60),
      dubbingLanguageNames: cleanArray(series.dubbingLanguageNames, 8, 60),
      tagNames: cleanArray(series.tagNames, 8, 60),
      genreNames: cleanArray(series.genreNames, 5, 60),
      episodeNumber,
      episodeTitle: clean(episode.title, 200),
      seasonNumber,
      channelName: clean(episode.channelName, 200),
      channelUrl: clean(episode.channelUrl, 500),
      linkedSeriesId,
    },
  };
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanArray(value: unknown, max: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const cleaned = clean(item, maxLen);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * POST /api/user/series/embed/confirm
 *
 * Body: EmbedConfirmInput
 * Persiste:
 *  - Series con origin='USER_EMBED', visibility segun rol,
 *    catalogScope='WATCHABLE_ONLY', submittedById=session.user.id
 *  - Season 1 (por default) o el seasonNumber pasado.
 *  - Episode con embedUrl, embedPlatform, embedVideoId, embedChannelName.
 *  - Asociaciones a entidades editoriales existentes. Ninguna alta o
 *    actualizacion de vocabulario compartido desde este flujo.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  let body: EmbedConfirmInput;
  try {
    body = (await request.json()) as EmbedConfirmInput;
  } catch {
    return NextResponse.json(
      { error: 'JSON invalido en el body.' },
      { status: 400 }
    );
  }

  const parsed = parseAndValidate(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: parsed.status }
    );
  }
  const data = parsed.data;

  // Politica de contenido oficial: solo videos de canales de la lista
  // blanca, verificados contra YouTube (el channelUrl del body no se usa
  // para decidir). Ver docs/politica-contenido-oficial.md.
  if (data.platform !== 'YouTube') {
    return NextResponse.json({ error: ONLY_YOUTUBE_ERROR }, { status: 422 });
  }
  const officialCheck = await checkOfficialYouTubeVideos([data.videoId]);
  if (!officialCheck.ok) {
    return NextResponse.json(
      { error: officialCheck.error },
      { status: officialCheck.status }
    );
  }
  const verifiedChannel = officialCheck.infos.get(data.videoId)!;

  // Rate limit por user.
  const rl = await checkUserEmbedRateLimit(auth.userId);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.reason },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  // Dedupe global por embedUrl.
  const dupByUrl = await prisma.episode.findFirst({
    where: { embedUrl: data.url },
    select: { season: { select: { seriesId: true } } },
  });
  if (dupByUrl) {
    return NextResponse.json(
      {
        error: 'Esta URL ya fue agregada por alguien mas.',
        existingSeriesId: dupByUrl.season.seriesId,
      },
      { status: 409 }
    );
  }

  // Dedupe submitter+title+year (mismo user reportando lo mismo).
  const dupByUser = await prisma.series.findFirst({
    where: {
      submittedById: auth.userId,
      title: data.title,
      year: data.year,
    },
    select: { id: true },
  });
  if (dupByUser) {
    return NextResponse.json(
      {
        error: 'Ya agregaste una serie con este titulo y año.',
        existingSeriesId: dupByUser.id,
      },
      { status: 409 }
    );
  }

  const metadata = await getContributionMetadata(data);
  if (!metadata.ok) {
    return NextResponse.json(
      contributionMetadataFailure(metadata.unresolvedNames),
      { status: 422 }
    );
  }
  const { countryId, productionCompanyId, originalLanguageId } = metadata.data;

  // Validamos linkedSeriesId antes del create: tiene que existir + ser
  // CURATED. Si el front mando un ID invalido o de un USER_EMBED, lo
  // descartamos silenciosamente (mejor crear sin link que rechazar el
  // submit entero).
  let validatedLinkedSeriesId: number | null = null;
  if (data.linkedSeriesId !== null) {
    const target = await prisma.series.findUnique({
      where: { id: data.linkedSeriesId },
      select: { id: true, origin: true },
    });
    if (target && target.origin === 'CURATED') {
      validatedLinkedSeriesId = target.id;
    }
  }

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MODERATOR';
  const visibility = isAdmin ? 'VISIBLE' : 'PENDING_REVIEW';

  const newSeries = await prisma.$transaction(async (tx) => {
    const series = await tx.series.create({
      data: {
        title: data.title,
        originalTitle: data.originalTitle,
        year: data.year,
        type: data.type,
        synopsis: data.synopsis,
        catalogScope: 'WATCHABLE_ONLY',
        origin: 'USER_EMBED',
        visibility,
        submittedById: auth.userId,
        countryId,
        productionCompanyId,
        originalLanguageId,
        linkedSeriesId: validatedLinkedSeriesId,
      },
    });

    for (const actorId of metadata.data.actorIds) {
      await tx.seriesActor.create({
        data: { seriesId: series.id, actorId, character: '', isMain: false },
      });
    }
    for (const tagId of metadata.data.tagIds) {
      await tx.seriesTag.create({ data: { seriesId: series.id, tagId } });
    }
    for (const genreId of metadata.data.genreIds) {
      await tx.seriesGenre.create({ data: { seriesId: series.id, genreId } });
    }
    for (const languageId of metadata.data.dubbingLanguageIds) {
      await tx.seriesDubbing.create({
        data: { seriesId: series.id, languageId },
      });
    }

    // Season + Episode
    const season = await tx.season.create({
      data: {
        seriesId: series.id,
        seasonNumber: data.seasonNumber,
        episodeCount: 1,
        year: data.year ?? undefined,
      },
    });

    await tx.episode.create({
      data: {
        seasonId: season.id,
        episodeNumber: data.episodeNumber,
        title: data.episodeTitle,
        embedUrl: data.url,
        embedPlatform: data.platform,
        embedVideoId: data.videoId,
        embedChannelName: verifiedChannel.channelTitle || data.channelName,
        embedChannelUrl: verifiedChannel.channelUrl || data.channelUrl,
      },
    });

    // Aporto = quiere verla. Marcamos automaticamente VIENDO para que
    // aparezca en el widget "Viendo ahora" del dashboard y en /watching
    // sin que el usuario tenga que click el toggle de estado.
    await tx.viewStatus.upsert({
      where: {
        userId_seriesId: { userId: auth.userId, seriesId: series.id },
      },
      update: { status: 'VIENDO' },
      create: {
        userId: auth.userId,
        seriesId: series.id,
        status: 'VIENDO',
      },
    });

    return series;
  });

  return NextResponse.json(
    { seriesId: newSeries.id, pendingReview: !isAdmin },
    { status: 201 }
  );
}
