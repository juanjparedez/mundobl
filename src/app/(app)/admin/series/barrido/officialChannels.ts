/**
 * Canales oficiales de productoras BL/GL, como atajos del barrido.
 *
 * TODOS los handles de esta lista fueron verificados uno por uno contra
 * el titulo real del canal (2026-09-06). No agregar de memoria: los
 * handles "obvios" son casi siempre homonimos. Comprobados en su momento
 * y descartados por eso mismo:
 *   @BeOnCloud   → "Lui Han", un canal personal indonesio
 *   @domundi     → "Ios 23:59"
 *   @WabiSabi    → "Danh Hasenmyer"
 *   @Strongberry → un musico centroafricano
 *
 * Para sumar uno: abrir el canal, confirmar que el titulo es la
 * productora, y recien ahi pegar el handle.
 */
export interface OfficialChannel {
  name: string;
  url: string;
  /** Bandera del pais de la productora, para ubicarla de un vistazo. */
  country: string;
}

export const OFFICIAL_BL_CHANNELS: OfficialChannel[] = [
  { name: 'GMMTV', url: 'https://www.youtube.com/@gmmtv', country: '🇹🇭' },
  {
    name: 'Be On Cloud',
    url: 'https://www.youtube.com/@beoncloudofficial',
    country: '🇹🇭',
  },
  {
    name: 'Idol Factory',
    url: 'https://www.youtube.com/@idolfactory',
    country: '🇹🇭',
  },
  {
    name: 'Star Hunter',
    url: 'https://www.youtube.com/@StarHunterEntertainment',
    country: '🇹🇭',
  },
  {
    name: 'Dee Hup House',
    url: 'https://www.youtube.com/@DeeHupHouse',
    country: '🇹🇭',
  },
  {
    name: 'DomundiTV',
    url: 'https://www.youtube.com/@domunditv',
    country: '🇹🇭',
  },
  {
    name: 'Studio Wabi Sabi',
    url: 'https://www.youtube.com/@StudioWabiSabi',
    country: '🇹🇭',
  },
  {
    name: 'Mandee',
    url: 'https://www.youtube.com/@MandeeWork',
    country: '🇹🇭',
  },
  {
    name: 'Strongberry',
    url: 'https://www.youtube.com/@StrongberryKr',
    country: '🇰🇷',
  },
  {
    name: 'IdeaFirst',
    url: 'https://www.youtube.com/@TheIdeaFirstCompany',
    country: '🇵🇭',
  },
  {
    name: 'GagaOOLala',
    url: 'https://www.youtube.com/@GagaOOLala',
    country: '🇹🇼',
  },
  {
    name: 'WeTV Thailand',
    url: 'https://www.youtube.com/@WeTVThailand',
    country: '🇹🇭',
  },
];
