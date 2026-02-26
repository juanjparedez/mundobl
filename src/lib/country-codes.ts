/**
 * Mapping of country names (Spanish) to ISO 3166-1 alpha-2 codes (lowercase).
 * Used to auto-assign codes when creating/updating countries.
 * Includes common name variants and alternate spellings.
 */
const COUNTRY_CODES: Record<string, string> = {
  // ============================================
  // ASIA ORIENTAL
  // ============================================
  China: 'cn',
  'Corea del Norte': 'kp',
  'Corea del Sur': 'kr',
  Corea: 'kr',
  Japón: 'jp',
  Japan: 'jp',
  Mongolia: 'mn',
  Taiwán: 'tw',
  Taiwan: 'tw',
  'Hong Kong': 'hk',
  Macao: 'mo',

  // ============================================
  // SUDESTE ASIÁTICO
  // ============================================
  Birmania: 'mm',
  Myanmar: 'mm',
  Brunéi: 'bn',
  Brunei: 'bn',
  Camboya: 'kh',
  Filipinas: 'ph',
  Indonesia: 'id',
  Laos: 'la',
  Malasia: 'my',
  Singapur: 'sg',
  Tailandia: 'th',
  'Timor Oriental': 'tl',
  Vietnam: 'vn',

  // ============================================
  // ASIA MERIDIONAL
  // ============================================
  Afganistán: 'af',
  Bangladés: 'bd',
  Bangladesh: 'bd',
  Bután: 'bt',
  India: 'in',
  Maldivas: 'mv',
  Nepal: 'np',
  Pakistán: 'pk',
  'Sri Lanka': 'lk',

  // ============================================
  // ASIA CENTRAL
  // ============================================
  Kazajistán: 'kz',
  Kirguistán: 'kg',
  Tayikistán: 'tj',
  Turkmenistán: 'tm',
  Uzbekistán: 'uz',

  // ============================================
  // ASIA OCCIDENTAL / MEDIO ORIENTE
  // ============================================
  'Arabia Saudita': 'sa',
  'Arabia Saudí': 'sa',
  Baréin: 'bh',
  Bahrein: 'bh',
  Catar: 'qa',
  Qatar: 'qa',
  Chipre: 'cy',
  'Emiratos Árabes Unidos': 'ae',
  'Emiratos Árabes': 'ae',
  Georgia: 'ge',
  Irak: 'iq',
  Irán: 'ir',
  Israel: 'il',
  Jordania: 'jo',
  Kuwait: 'kw',
  Líbano: 'lb',
  Omán: 'om',
  Palestina: 'ps',
  Siria: 'sy',
  Turquía: 'tr',
  Yemen: 'ye',
  Armenia: 'am',
  Azerbaiyán: 'az',

  // ============================================
  // EUROPA OCCIDENTAL
  // ============================================
  Alemania: 'de',
  Austria: 'at',
  Bélgica: 'be',
  Francia: 'fr',
  Irlanda: 'ie',
  Liechtenstein: 'li',
  Luxemburgo: 'lu',
  Mónaco: 'mc',
  'Países Bajos': 'nl',
  Holanda: 'nl',
  'Reino Unido': 'gb',
  Suiza: 'ch',

  // ============================================
  // EUROPA MERIDIONAL
  // ============================================
  Albania: 'al',
  Andorra: 'ad',
  'Bosnia y Herzegovina': 'ba',
  Croacia: 'hr',
  Eslovenia: 'si',
  España: 'es',
  Grecia: 'gr',
  Italia: 'it',
  Macedonia: 'mk',
  'Macedonia del Norte': 'mk',
  Malta: 'mt',
  Montenegro: 'me',
  Portugal: 'pt',
  'San Marino': 'sm',
  Serbia: 'rs',
  Vaticano: 'va',

  // ============================================
  // EUROPA SEPTENTRIONAL
  // ============================================
  Dinamarca: 'dk',
  Estonia: 'ee',
  Finlandia: 'fi',
  Islandia: 'is',
  Letonia: 'lv',
  Lituania: 'lt',
  Noruega: 'no',
  Suecia: 'se',

  // ============================================
  // EUROPA ORIENTAL
  // ============================================
  Bielorrusia: 'by',
  Bulgaria: 'bg',
  Eslovaquia: 'sk',
  Hungría: 'hu',
  Moldavia: 'md',
  Polonia: 'pl',
  'República Checa': 'cz',
  Chequia: 'cz',
  Rumania: 'ro',
  Rumanía: 'ro',
  Rusia: 'ru',
  Ucrania: 'ua',
  Kosovo: 'xk',

  // ============================================
  // AMÉRICA DEL NORTE
  // ============================================
  Canadá: 'ca',
  'Estados Unidos': 'us',
  EEUU: 'us',
  EUA: 'us',
  México: 'mx',

  // ============================================
  // CENTROAMÉRICA Y CARIBE
  // ============================================
  Belice: 'bz',
  'Costa Rica': 'cr',
  Cuba: 'cu',
  'El Salvador': 'sv',
  Guatemala: 'gt',
  Haití: 'ht',
  Honduras: 'hn',
  Jamaica: 'jm',
  Nicaragua: 'ni',
  Panamá: 'pa',
  'Puerto Rico': 'pr',
  'República Dominicana': 'do',
  'Trinidad y Tobago': 'tt',
  Bahamas: 'bs',
  Barbados: 'bb',
  Dominica: 'dm',
  Granada: 'gd',
  'San Cristóbal y Nieves': 'kn',
  'Santa Lucía': 'lc',
  'San Vicente y las Granadinas': 'vc',
  'Antigua y Barbuda': 'ag',

  // ============================================
  // AMÉRICA DEL SUR
  // ============================================
  Argentina: 'ar',
  Bolivia: 'bo',
  Brasil: 'br',
  Chile: 'cl',
  Colombia: 'co',
  Ecuador: 'ec',
  Guyana: 'gy',
  Paraguay: 'py',
  Perú: 'pe',
  Surinam: 'sr',
  Uruguay: 'uy',
  Venezuela: 've',

  // ============================================
  // ÁFRICA DEL NORTE
  // ============================================
  Argelia: 'dz',
  Egipto: 'eg',
  Libia: 'ly',
  Marruecos: 'ma',
  Mauritania: 'mr',
  'Sáhara Occidental': 'eh',
  Túnez: 'tn',
  Sudán: 'sd',

  // ============================================
  // ÁFRICA OCCIDENTAL
  // ============================================
  Benín: 'bj',
  'Burkina Faso': 'bf',
  'Cabo Verde': 'cv',
  'Costa de Marfil': 'ci',
  Gambia: 'gm',
  Ghana: 'gh',
  Guinea: 'gn',
  'Guinea-Bisáu': 'gw',
  'Guinea-Bisau': 'gw',
  Liberia: 'lr',
  Mali: 'ml',
  Malí: 'ml',
  Níger: 'ne',
  Nigeria: 'ng',
  Senegal: 'sn',
  'Sierra Leona': 'sl',
  Togo: 'tg',

  // ============================================
  // ÁFRICA ORIENTAL
  // ============================================
  Burundi: 'bi',
  Comoras: 'km',
  Eritrea: 'er',
  Etiopía: 'et',
  Kenia: 'ke',
  Madagascar: 'mg',
  Malaui: 'mw',
  Malawi: 'mw',
  Mauricio: 'mu',
  Mozambique: 'mz',
  Ruanda: 'rw',
  Seychelles: 'sc',
  Somalia: 'so',
  'Sudán del Sur': 'ss',
  Tanzania: 'tz',
  Uganda: 'ug',
  Yibuti: 'dj',
  Zimbabue: 'zw',
  Zimbabwe: 'zw',

  // ============================================
  // ÁFRICA CENTRAL
  // ============================================
  Camerún: 'cm',
  Chad: 'td',
  Congo: 'cg',
  'República del Congo': 'cg',
  'República Democrática del Congo': 'cd',
  'RD del Congo': 'cd',
  Gabón: 'ga',
  'Guinea Ecuatorial': 'gq',
  'República Centroafricana': 'cf',
  'Santo Tomé y Príncipe': 'st',

  // ============================================
  // ÁFRICA MERIDIONAL
  // ============================================
  Angola: 'ao',
  Botsuana: 'bw',
  Botswana: 'bw',
  Lesoto: 'ls',
  Namibia: 'na',
  Suazilandia: 'sz',
  Esuatini: 'sz',
  Sudáfrica: 'za',
  Zambia: 'zm',

  // ============================================
  // OCEANÍA
  // ============================================
  Australia: 'au',
  Fiyi: 'fj',
  Fiji: 'fj',
  Kiribati: 'ki',
  'Islas Marshall': 'mh',
  Micronesia: 'fm',
  Nauru: 'nr',
  'Nueva Zelanda': 'nz',
  Palaos: 'pw',
  'Papúa Nueva Guinea': 'pg',
  Samoa: 'ws',
  'Islas Salomón': 'sb',
  Tonga: 'to',
  Tuvalu: 'tv',
  Vanuatu: 'vu',
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
