/** Editorial references, not live quotes or affiliate agreements.
 * Evidence and review procedure: docs/plataformas-fuentes.md.
 */
export interface PlatformPlan {
  name: string;
  amount: number;
  currency: 'USD' | 'ARS';
  months: 1 | 3 | 6 | 12;
}
export interface StreamingPlatformInfo {
  id: string;
  name: string;
  descriptionKey:
    | 'gaga'
    | 'viki'
    | 'iqiyi'
    | 'wetv'
    | 'youtube'
    | 'heavenly'
    | 'netflix'
    | 'bilibili'
    | 'vimeo';
  sourceUrl: string;
  reviewedOn: string;
  country: 'AR' | null;
  channel: 'web';
  pricing:
    | { status: 'observed'; plans: PlatformPlan[] }
    | { status: 'consult' | 'closing' };
}
export const STREAMING_PLATFORMS: StreamingPlatformInfo[] = [
  {
    id: 'gagaoolala',
    name: 'GagaOOLala',
    descriptionKey: 'gaga',
    sourceUrl: 'https://www.gagaoolala.com/en/plans',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: {
      status: 'observed',
      plans: [
        { name: 'VIP', amount: 4.99, currency: 'USD', months: 1 },
        { name: 'VIP', amount: 13.99, currency: 'USD', months: 3 },
        { name: 'VIP', amount: 23.99, currency: 'USD', months: 6 },
        { name: 'VIP', amount: 43.99, currency: 'USD', months: 12 },
      ],
    },
  },
  {
    id: 'viki',
    name: 'Rakuten Viki',
    descriptionKey: 'viki',
    sourceUrl: 'https://www.viki.com/pass',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: {
      status: 'observed',
      plans: [
        { name: 'Standard', amount: 4.99, currency: 'USD', months: 1 },
        { name: 'Standard', amount: 49.99, currency: 'USD', months: 12 },
        { name: 'Plus', amount: 9.99, currency: 'USD', months: 1 },
        { name: 'Plus', amount: 99.99, currency: 'USD', months: 12 },
      ],
    },
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    descriptionKey: 'iqiyi',
    sourceUrl: 'https://www.iq.com/',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'consult' },
  },
  {
    id: 'wetv',
    name: 'WeTV',
    descriptionKey: 'wetv',
    sourceUrl: 'https://wetv.vip/',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'consult' },
  },
  {
    id: 'youtube-official',
    name: 'YouTube',
    descriptionKey: 'youtube',
    sourceUrl: 'https://support.google.com/youtube/answer/6304294',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'consult' },
  },
  {
    id: 'heavenly',
    name: 'Heavenly',
    descriptionKey: 'heavenly',
    sourceUrl: 'https://heavenly.tv/',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'consult' },
  },
  {
    id: 'netflix',
    name: 'Netflix',
    descriptionKey: 'netflix',
    sourceUrl: 'https://help.netflix.com/es/node/24926',
    reviewedOn: '2026-10-12',
    country: 'AR',
    channel: 'web',
    pricing: {
      status: 'observed',
      plans: [
        { name: 'Básico', amount: 8999, currency: 'ARS', months: 1 },
        { name: 'Estándar', amount: 14999, currency: 'ARS', months: 1 },
        { name: 'Premium', amount: 19999, currency: 'ARS', months: 1 },
      ],
    },
  },
  {
    id: 'bilibili',
    name: 'Bilibili TV',
    descriptionKey: 'bilibili',
    sourceUrl: 'https://www.bilibili.tv/',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'consult' },
  },
  {
    id: 'vimeo-vod',
    name: 'Vimeo On Demand',
    descriptionKey: 'vimeo',
    sourceUrl: 'https://vimeo.com/ondemand/faq/viewers',
    reviewedOn: '2026-10-12',
    country: null,
    channel: 'web',
    pricing: { status: 'closing' },
  },
];
