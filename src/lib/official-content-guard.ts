/**
 * Guardia unica para todo lo que escribe un embed de episodio.
 *
 * Regla (docs/politica-contenido-oficial.md): un episodio solo se embebe
 * si el video pertenece a una fuente oficial verificada. Se consulta la
 * API del proveedor (YouTube, Vimeo o Dailymotion); el propietario real y
 * la disponibilidad no se toman del cliente. Sin verificacion no hay embed.
 *
 * Usada por: /api/user/series/embed/confirm (aportes de usuarios),
 * /api/series/import-playlist/confirm (importador), /api/episodes y
 * /api/episodes/[id] (alta y edicion manual desde admin).
 */
import {
  verifyYouTubeVideosOfficial,
  type VideoChannelInfo,
} from './channel-fetcher';
import { UNOFFICIAL_CHANNEL_ERROR } from './official-channels';
import { parseEpisodeSource } from './episode-platforms';
import {
  EpisodeSourceError,
  verifyExternalEpisode,
  type ExternalEpisodeInfo,
  type EpisodeSourceErrorCode,
} from './external-episode-source';
import { MESSAGES } from '../i18n/messages';
import {
  MIN_EPISODE_SECONDS,
  probeViaApi,
  type PlaybackProbe,
  type PlaybackStatus,
} from './playability';

export function episodeSourceFailure(
  code: EpisodeSourceErrorCode,
  status: 422 | 503 = 422
) {
  return {
    ok: false as const,
    status,
    error: MESSAGES.es!.episodeSource[code],
    errorKey: `episodeSource.${code}` as const,
  };
}

export const ONLY_YOUTUBE_ERROR =
  'Por ahora solo se aceptan episodios publicados en el canal oficial de YouTube de la productora o distribuidora.';

export const VERIFY_UNAVAILABLE_ERROR =
  'No se pudo verificar el canal del video (la verificación con YouTube no está disponible ahora). Probá de nuevo más tarde.';

export type OfficialCheck =
  | { ok: true; infos: Map<string, VideoChannelInfo> }
  | {
      ok: false;
      status: 422 | 503;
      error: string;
      offenders: Array<{ videoId: string; channelTitle: string | null }>;
    };

/**
 * Verifica que TODOS los videoIds pertenezcan a canales oficiales. Un solo
 * video fuera de la lista rechaza el lote entero: una serie con episodios
 * mezclados no respeta la regla.
 */
export async function checkOfficialYouTubeVideos(
  videoIds: string[]
): Promise<OfficialCheck> {
  const ids = Array.from(new Set(videoIds.filter(Boolean)));
  if (ids.length === 0) {
    return { ok: false, status: 422, error: ONLY_YOUTUBE_ERROR, offenders: [] };
  }

  let infos: Map<string, VideoChannelInfo>;
  try {
    infos = await verifyYouTubeVideosOfficial(ids);
  } catch (error) {
    console.error('[official-content-guard] verificacion fallo:', error);
    return {
      ok: false,
      status: 503,
      error: VERIFY_UNAVAILABLE_ERROR,
      offenders: [],
    };
  }

  const offenders: Array<{ videoId: string; channelTitle: string | null }> = [];
  for (const id of ids) {
    const info = infos.get(id);
    if (!info) {
      // Video borrado/privado: no se puede verificar → no entra.
      offenders.push({ videoId: id, channelTitle: null });
    } else if (!info.official) {
      offenders.push({ videoId: id, channelTitle: info.channelTitle });
    }
  }

  if (offenders.length > 0) {
    const named = offenders
      .map((o) => o.channelTitle)
      .filter((t): t is string => !!t);
    const detail =
      named.length > 0
        ? ` Canal detectado: ${Array.from(new Set(named)).slice(0, 3).join(', ')}.`
        : '';
    return {
      ok: false,
      status: 422,
      error: `${UNOFFICIAL_CHANNEL_ERROR}${detail}`,
      offenders,
    };
  }

  return { ok: true, infos };
}

export interface EmbedFields {
  embedUrl: string | null;
  embedPlatform: string | null;
  embedVideoId: string | null;
  embedChannelName: string | null;
  embedChannelUrl: string | null;
  durationSeconds: number | null;
  playback: PlaybackStatus;
  playbackBlockedMarkets: string[];
  playbackCheckedAt: Date | null;
  youtubeViewCount: number | null;
  youtubeLikeCount: number | null;
}

export type ResolvedEmbed =
  | { ok: true; fields: EmbedFields; source?: ExternalEpisodeInfo }
  | { ok: false; status: 422 | 503; error: string; errorKey?: string };

/**
 * Resuelve los campos de embed de un episodio a partir de la URL y los
 * valida contra la lista blanca. URL vacia = sin embed (valido). El nombre
 * y la URL del canal se toman de la verificacion, no del input.
 */
export async function resolveOfficialEmbedFields(input: {
  embedUrl?: string | null;
  embedPlatform?: string | null;
}): Promise<ResolvedEmbed> {
  const url = input.embedUrl?.trim() || null;
  if (!url) {
    return {
      ok: true,
      fields: {
        embedUrl: null,
        embedPlatform: null,
        embedVideoId: null,
        embedChannelName: null,
        embedChannelUrl: null,
        durationSeconds: null,
        playback: 'UNKNOWN',
        playbackBlockedMarkets: [],
        playbackCheckedAt: null,
        youtubeViewCount: null,
        youtubeLikeCount: null,
      },
    };
  }

  const parsed = parseEpisodeSource(url);
  if (
    !parsed ||
    (input.embedPlatform && input.embedPlatform !== parsed.platform)
  ) {
    return episodeSourceFailure('unsupported');
  }
  const { platform, videoId } = parsed;
  if (platform !== 'YouTube') {
    try {
      const source = await verifyExternalEpisode(parsed);
      return {
        ok: true,
        source,
        fields: {
          embedUrl: parsed.url,
          embedPlatform: platform,
          embedVideoId: videoId,
          embedChannelName: source.channelName,
          embedChannelUrl: source.channelUrl,
          durationSeconds: source.probe.durationSeconds,
          playback: source.probe.status,
          playbackBlockedMarkets: source.probe.blockedMarkets,
          playbackCheckedAt: new Date(),
          youtubeViewCount: null,
          youtubeLikeCount: null,
        },
      };
    } catch (error) {
      return error instanceof EpisodeSourceError
        ? episodeSourceFailure(error.code, error.status)
        : episodeSourceFailure('unavailable', 503);
    }
  }

  const check = await checkOfficialYouTubeVideos([videoId]);
  if (!check.ok) return { ok: false, status: check.status, error: check.error };

  const info = check.infos.get(videoId)!;
  let probe: PlaybackProbe;
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return episodeSourceFailure('unavailable', 503);
    [probe] = await probeViaApi([videoId], key);
  } catch {
    return episodeSourceFailure('unavailable', 503);
  }
  if (probe.status !== 'OK') return episodeSourceFailure('notPlayable');
  if (probe.durationSeconds === null)
    return episodeSourceFailure('unavailable', 503);
  if (probe.durationSeconds < MIN_EPISODE_SECONDS)
    return episodeSourceFailure('tooShort');
  return {
    ok: true,
    fields: {
      embedUrl: parsed.url,
      embedPlatform: platform,
      embedVideoId: videoId,
      embedChannelName: info.channelTitle || null,
      embedChannelUrl: info.channelUrl || null,
      durationSeconds: probe.durationSeconds,
      playback: probe.status,
      playbackBlockedMarkets: probe.blockedMarkets,
      playbackCheckedAt: new Date(),
      youtubeViewCount: probe.viewCount ?? null,
      youtubeLikeCount: probe.likeCount ?? null,
    },
  };
}
