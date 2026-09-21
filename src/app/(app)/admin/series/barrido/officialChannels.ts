/**
 * Atajos del barrido: la lista blanca de canales oficiales vive en
 * src/lib/official-channels.ts (es la misma que usan los importadores y el
 * script de limpieza). Aca solo se adapta a la forma que espera BarridoClient.
 */
import { OFFICIAL_CHANNELS, officialChannelUrl } from '@/lib/official-channels';

export interface OfficialChannel {
  name: string;
  url: string;
  /** Bandera del pais de la productora, para ubicarla de un vistazo. */
  country: string;
}

export const OFFICIAL_BL_CHANNELS: OfficialChannel[] = OFFICIAL_CHANNELS.map(
  (ch) => ({ name: ch.name, url: officialChannelUrl(ch), country: ch.country })
);
