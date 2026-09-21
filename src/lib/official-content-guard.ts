/**
 * Guardia unica para todo lo que escribe un embed de episodio.
 *
 * Regla (docs/politica-contenido-oficial.md): un episodio solo se embebe
 * si el video pertenece a un canal de la lista blanca. Se verifica contra
 * la YouTube Data API (canal real del video), nunca contra lo que manda el
 * cliente. Si la API no esta disponible, se rechaza: sin verificacion no
 * hay embed.
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
import { detectPlatform, extractVideoId, type Platform } from './embed-helpers';

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
}

export type ResolvedEmbed =
  | { ok: true; fields: EmbedFields }
  | { ok: false; status: 422 | 503; error: string };

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
      },
    };
  }

  const platform =
    (input.embedPlatform as Platform | null) ?? detectPlatform(url);
  if (platform !== 'YouTube') {
    return { ok: false, status: 422, error: ONLY_YOUTUBE_ERROR };
  }

  const videoId = extractVideoId(platform, url);
  if (!videoId) {
    return { ok: false, status: 422, error: 'URL de YouTube inválida.' };
  }

  const check = await checkOfficialYouTubeVideos([videoId]);
  if (!check.ok) return { ok: false, status: check.status, error: check.error };

  const info = check.infos.get(videoId)!;
  return {
    ok: true,
    fields: {
      embedUrl: url,
      embedPlatform: platform,
      embedVideoId: videoId,
      embedChannelName: info.channelTitle || null,
      embedChannelUrl: info.channelUrl || null,
    },
  };
}
