import { XMLParser } from 'fast-xml-parser';
import { prisma } from './database';
import { OFFICIAL_CHANNELS } from './official-channels';
import { fetchYouTubeChannel } from './channel-fetcher';
import { titleTokens } from './channel-sweep';
import { runCronJob } from './cron-runs';

/**
 * Ingesta diaria de noticias (la corre /api/cron/daily). Todo entra en
 * REVIEW: nada se publica sin que alguien lo lea (/admin/noticias, un click).
 *
 * Fuentes: el RSS de los sitios recomendados de la categoria "noticias" y
 * los avances de series nuevas de los canales oficiales. Se deduplica por
 * originalUrl y se intenta asociar cada noticia a una serie del catalogo.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const RSS_MAX_AGE_DAYS = 7;
const VIDEO_MAX_AGE_DAYS = 3;
const PER_SOURCE_LIMIT = 5;
const MAX_NEW_PER_RUN = 40;
// Sus avances son dramas chinos doblados, no BL.
const EXCLUDED_CHANNELS = new Set(['WeTVThailand']);
// El avance de una serie, no el del proximo capitulo ("EP.3") ni el de una
// cancion ("Ost.").
const TRAILER = /\b(official\s+)?(trailer|teaser)\b/i;
const NOT_A_SERIES_TRAILER = /\bep\.?\s*\d|\bost\b/i;
// Sitio dedicado a BL/GL, o nota que habla de eso. De un sitio general
// (K-pop, cine) entra solo lo que nombra una serie del catalogo o esto.
const BL_TOPIC = /\b(bl|gl)\b|boys'? ?love|girls'? ?love|\byaoi\b|\byuri\b/i;

interface Candidate {
  title: string;
  summary: string;
  originalUrl: string;
  sourceName: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  /** Viene de un sitio o canal dedicado a BL/GL. */
  blSource: boolean;
}

type Media = { '@_url'?: string; '@_type'?: string };
interface RssItem {
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  description?: unknown;
  'content:encoded'?: unknown;
  enclosure?: Media;
  'media:content'?: Media | Media[];
  'media:thumbnail'?: Media | Media[];
}
interface AtomEntry {
  title?: unknown;
  link?:
    | { '@_href'?: string; '@_rel'?: string }
    | Array<{ '@_href'?: string; '@_rel'?: string }>;
  published?: unknown;
  updated?: unknown;
  summary?: unknown;
  content?: unknown;
}
interface FeedDoc {
  rss?: { channel?: { item?: RssItem | RssItem[] } };
  feed?: { entry?: AtomEntry | AtomEntry[] };
}

const parser = new XMLParser({ ignoreAttributes: false });

const toArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

function text(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  if (value && typeof value === 'object' && '#text' in value) {
    return String((value as { '#text': unknown })['#text']);
  }
  return '';
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (all, name: string) => NAMED_ENTITIES[name] ?? all)
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value: string, max = 320): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max)}…`;
}

function parseDate(value: string): Date | null {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? date : null;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'MundoBL (+https://mundobl.com.ar)' },
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/** El feed del sitio: el <link rel="alternate"> de su home, o /feed. */
async function discoverFeed(siteUrl: string): Promise<string> {
  const html = await fetchText(siteUrl);
  const tag = html?.match(
    /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]*>/i
  )?.[0];
  const href = tag?.match(/href=["']([^"']+)["']/i)?.[1];
  return new URL(href ?? '/feed', siteUrl).toString();
}

function firstImage(item: RssItem): string | null {
  const media = [
    ...toArray(item['media:content']),
    ...toArray(item['media:thumbnail']),
    ...toArray(item.enclosure),
  ].find(
    (m) => m['@_url'] && (!m['@_type'] || m['@_type'].startsWith('image'))
  );
  if (media?.['@_url']) return media['@_url'];
  const inline = text(item['content:encoded']) || text(item.description);
  return inline.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? null;
}

function fromFeed(
  xml: string,
  sourceName: string,
  blSource: boolean
): Candidate[] {
  let doc: FeedDoc;
  try {
    doc = parser.parse(xml) as FeedDoc;
  } catch {
    return [];
  }
  const rss = toArray(doc.rss?.channel?.item).map((item): Candidate => {
    const title = stripHtml(text(item.title));
    return {
      title,
      summary:
        excerpt(
          stripHtml(text(item.description) || text(item['content:encoded']))
        ) || title,
      originalUrl: text(item.link).trim(),
      sourceName,
      blSource,
      imageUrl: firstImage(item),
      publishedAt: parseDate(text(item.pubDate)),
    };
  });
  const atom = toArray(doc.feed?.entry).map((entry): Candidate => {
    const links = toArray(entry.link);
    const link =
      links.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate') ?? links[0];
    const title = stripHtml(text(entry.title));
    return {
      title,
      summary:
        excerpt(stripHtml(text(entry.summary) || text(entry.content))) || title,
      originalUrl: link?.['@_href']?.trim() ?? '',
      sourceName,
      blSource,
      imageUrl: null,
      publishedAt: parseDate(text(entry.published) || text(entry.updated)),
    };
  });
  return [...rss, ...atom];
}

function isRecent(candidate: Candidate, maxAgeDays: number): boolean {
  return (
    candidate.publishedAt !== null &&
    candidate.publishedAt.getTime() >= Date.now() - maxAgeDays * DAY_MS
  );
}

async function fromNewsSites(): Promise<{
  items: Candidate[];
  failed: number;
  sources: number;
}> {
  const sites = await prisma.recommendedSite.findMany({
    where: { category: { equals: 'noticias', mode: 'insensitive' } },
    select: { name: true, url: true },
  });
  let failed = 0;
  const batches = await Promise.all(
    sites.map(async (site) => {
      const xml = await fetchText(await discoverFeed(site.url));
      if (!xml) {
        failed++;
        return [];
      }
      // Por nombre y dominio: la descripcion de un sitio general suele
      // mencionar BL igual.
      const blSource = BL_TOPIC.test(`${site.name} ${site.url}`);
      return fromFeed(xml, site.name, blSource)
        .filter(
          (c) =>
            c.title &&
            c.originalUrl.startsWith('http') &&
            isRecent(c, RSS_MAX_AGE_DAYS)
        )
        .slice(0, PER_SOURCE_LIMIT);
    })
  );
  return { items: batches.flat(), failed, sources: sites.length };
}

async function fromOfficialTrailers(): Promise<{
  items: Candidate[];
  failed: number;
  sources: number;
}> {
  const channels = OFFICIAL_CHANNELS.filter(
    (channel) => channel.channelId && !EXCLUDED_CHANNELS.has(channel.handle)
  );
  let failed = 0;
  const batches = await Promise.all(
    channels.map(async (channel) => {
      try {
        const { videos } = await fetchYouTubeChannel(
          `https://www.youtube.com/channel/${channel.channelId}`
        );
        return videos
          .map(
            (video): Candidate => ({
              title: video.title,
              summary: excerpt(video.description) || video.title,
              originalUrl: video.videoUrl,
              sourceName: video.channelName,
              imageUrl: video.thumbnailUrl || null,
              blSource: true,
              publishedAt: parseDate(video.publishedAt),
            })
          )
          .filter(
            (c) =>
              TRAILER.test(c.title) &&
              !NOT_A_SERIES_TRAILER.test(c.title) &&
              isRecent(c, VIDEO_MAX_AGE_DAYS)
          )
          .slice(0, PER_SOURCE_LIMIT);
      } catch {
        failed++;
        return [];
      }
    })
  );
  return { items: batches.flat(), failed, sources: channels.length };
}

/**
 * Asocia una noticia a la serie del catalogo cuyo titulo aparece en ella,
 * como frase y no palabras sueltas. Titulos genericos ("First Love", "Us")
 * quedan afuera: matchearian notas de cualquier cosa. Es una sugerencia:
 * quien revisa la cola la corrige antes de publicar.
 */
async function loadSeriesMatcher(): Promise<(title: string) => number | null> {
  const series = await prisma.series.findMany({
    where: { origin: 'CURATED', visibility: 'VISIBLE' },
    select: { id: true, title: true },
  });
  const entries = series
    .map((s) => ({ id: s.id, tokens: titleTokens(s.title) }))
    .filter(({ tokens }) =>
      tokens.length === 1 ? tokens[0].length >= 6 : tokens.join('').length >= 8
    )
    // Los mas largos primero: "Bad Buddy Series 2" gana a "Bad Buddy".
    .sort((a, b) => b.tokens.length - a.tokens.length);
  return (title) => {
    const words = ` ${titleTokens(title).join(' ')} `;
    return (
      entries.find(({ tokens }) => words.includes(` ${tokens.join(' ')} `))
        ?.id ?? null
    );
  };
}

export async function ingestNews({ dryRun = false } = {}) {
  const [sites, trailers] = await Promise.all([
    fromNewsSites(),
    fromOfficialTrailers(),
  ]);
  const matchSeries = await loadSeriesMatcher();
  const candidates = [...sites.items, ...trailers.items].filter(
    (c) =>
      c.blSource ||
      matchSeries(c.title) !== null ||
      BL_TOPIC.test(`${c.title} ${c.summary}`)
  );

  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.originalUrl)) return false;
    seen.add(c.originalUrl);
    return true;
  });
  const existing = await prisma.news.findMany({
    where: { originalUrl: { in: unique.map((c) => c.originalUrl) } },
    select: { originalUrl: true },
  });
  const known = new Set(existing.map((n) => n.originalUrl));
  const fresh = unique
    .filter((c) => !known.has(c.originalUrl))
    .slice(0, MAX_NEW_PER_RUN);

  if (fresh.length > 0 && !dryRun) {
    await prisma.news.createMany({
      data: fresh.map((c) => ({
        title: c.title.slice(0, 300),
        summary: c.summary.slice(0, 600),
        originalUrl: c.originalUrl,
        sourceName: c.sourceName,
        imageUrl: c.imageUrl,
        publishedAt: c.publishedAt,
        status: 'REVIEW' as const,
        aiGenerated: false,
        relatedSeriesId: matchSeries(c.title),
      })),
    });
  }

  return {
    sources: sites.sources + trailers.sources,
    failedSources: sites.failed + trailers.failed,
    candidates: unique.length,
    created: dryRun ? 0 : fresh.length,
    preview: fresh.map((c) => ({
      title: c.title,
      source: c.sourceName,
      seriesId: matchSeries(c.title),
    })),
  };
}

export function runNewsIngestJob() {
  return runCronJob(
    'news',
    () => ingestNews(),
    (result) => ({
      trigger: 'schedule',
      sources: result.sources,
      failedSources: result.failedSources,
      candidates: result.candidates,
      created: result.created,
    }),
    { trigger: 'schedule' }
  );
}
