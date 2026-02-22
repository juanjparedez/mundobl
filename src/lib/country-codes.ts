/**
 * Mapping of country names (Spanish) to ISO 3166-1 alpha-2 codes (lowercase).
 * Used to auto-assign codes when creating/updating countries.
 */
const COUNTRY_CODES: Record<string, string> = {
  // Asia (main BL countries)
  Tailandia: 'th',
  'Corea del Sur': 'kr',
  Corea: 'kr',
  Japón: 'jp',
  Japan: 'jp',
  China: 'cn',
  Taiwán: 'tw',
  Taiwan: 'tw',
  Filipinas: 'ph',
  Vietnam: 'vn',
  Myanmar: 'mm',
  Birmania: 'mm',
  Camboya: 'kh',
  Indonesia: 'id',
  Laos: 'la',
  'Hong Kong': 'hk',
  Malasia: 'my',
  Singapur: 'sg',
  India: 'in',
  // Americas
  'Estados Unidos': 'us',
  México: 'mx',
  Argentina: 'ar',
  Brasil: 'br',
  Colombia: 'co',
  Chile: 'cl',
  Perú: 'pe',
  // Europe
  'Reino Unido': 'gb',
  España: 'es',
  Francia: 'fr',
  Alemania: 'de',
  Italia: 'it',
};

/**
 * Returns the ISO code for a country name, or null if not found.
 * Case-insensitive lookup.
 */
export function getCountryCode(name: string): string | null {
  // Exact match first
  if (COUNTRY_CODES[name]) return COUNTRY_CODES[name];

  // Case-insensitive fallback
  const lower = name.toLowerCase();
  for (const [key, code] of Object.entries(COUNTRY_CODES)) {
    if (key.toLowerCase() === lower) return code;
  }

  return null;
}
