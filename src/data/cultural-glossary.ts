// Contenido curado a mano (español) — no pasa por el sistema de 10
// locales de src/i18n/messages.ts. Mismo criterio que sinopsis/notas/
// noticias en el resto del proyecto: es contenido autoral, no UI-chrome.
// La UI que envuelve estos datos (GlosarioClient.tsx) sí está traducida.
export interface GlossaryTerm {
  term: string;
  transliteration?: string;
  /** País/cultura de origen del término. 'general' = uso pan-asiático o
   *  propio del fandom, sin una cultura de origen única y clara. */
  country: 'thailand' | 'korea' | 'japan' | 'general';
  category:
    | 'honorifics'
    | 'relationships'
    | 'genreConcepts'
    | 'university'
    | 'fandom';
  meaning: string;
  context: string;
  commonMistake?: string;
  examples?: string;
}

export const CULTURAL_GLOSSARY: GlossaryTerm[] = [
  // ─── Tailandia ─────────────────────────────────────────────────────
  {
    term: 'แฟน',
    transliteration: 'Faen',
    country: 'thailand',
    category: 'relationships',
    meaning: 'Novio / Novia / Pareja romántica',
    context:
      'Término coloquial y afectivo que usan los personajes para referirse a su pareja.',
    commonMistake:
      'Los traductores automáticos suelen traducirlo erróneamente como "fan" o "seguidor" (ej: traduciendo My School President como "Fan mío es el presidente...").',
    examples: 'แฟนผม (Faen phom = Mi novio)',
  },
  {
    term: 'พี่',
    transliteration: 'Phi / P’',
    country: 'thailand',
    category: 'honorifics',
    meaning: 'Hermano mayor / Persona mayor de respeto y cariño',
    context:
      'Prefijo honorífico que se antepone al nombre de alguien mayor (compañero de universidad, colega o persona admirada). Transmite respeto y cercanía.',
    commonMistake:
      'Traducirlo rígidamente como "hermano de sangre" cuando en realidad es un trato social.',
    examples: 'P’Pran, P’Phupha, P’Kinn',
  },
  {
    term: 'น้อง',
    transliteration: 'Nong / N’',
    country: 'thailand',
    category: 'honorifics',
    meaning: 'Hermano menor / Persona menor',
    context:
      'Prefijo cariñoso y protector que usa alguien mayor para dirigirse a una persona más joven.',
    examples: 'N’Gun, N’Pat, N’Tian',
  },
  {
    term: 'คุณ',
    transliteration: 'Khun',
    country: 'thailand',
    category: 'honorifics',
    meaning: 'Señor / Señora / Usted (Tratamiento formal de respeto)',
    context:
      'Se usa en entornos laborales, familias aristocráticas o cuando dos personas aún no tienen confianza.',
    examples: 'Khun Sam, Khun Nueng',
  },
  {
    term: 'เฮีย',
    transliteration: 'Hia',
    country: 'thailand',
    category: 'honorifics',
    meaning: 'Hermano mayor (en familias tailandesas de ascendencia china)',
    context:
      'Equivalente a P’, pero con fuerte raíz cultural teochew / china. Denota afecto y protección.',
    examples: 'Hia Lian (en Cutie Pie), Hia Yi',
  },
  {
    term: 'ที่รัก',
    transliteration: 'Ti-lak',
    country: 'thailand',
    category: 'relationships',
    meaning: 'Mi amor / Querido / Cariño',
    context: 'Tratamiento íntimo y romántico entre parejas.',
  },
  {
    term: 'SOTUS',
    country: 'thailand',
    category: 'university',
    meaning: 'Seniority, Order, Tradition, Unity, Spirit',
    context:
      'Sistema tradicional de bienvenida y jerarquía universitaria en Tailandia (frecuente en facultades de Ingeniería). Central en series como SOTUS The Series.',
  },
  {
    term: 'ซีรีส์วาย',
    transliteration: 'Series Y',
    country: 'thailand',
    category: 'genreConcepts',
    meaning: 'Dramas BL (Boys’ Love)',
    context:
      'En Tailandia, el género BL se conoce como "Series Y" (por la letra Y del término japonés Yaoi).',
  },

  // ─── Corea del Sur ─────────────────────────────────────────────────
  {
    term: '오빠',
    transliteration: 'Oppa',
    country: 'korea',
    category: 'honorifics',
    meaning: 'Hermano mayor (dicho por una mujer)',
    context:
      'Una mujer lo usa para dirigirse a un hombre mayor cercano. También se usa de forma romántica entre parejas, sin implicar parentesco real.',
    commonMistake:
      'No es intercambiable con "Hyung" — el género de quien habla determina cuál corresponde.',
  },
  {
    term: '형',
    transliteration: 'Hyung',
    country: 'korea',
    category: 'honorifics',
    meaning: 'Hermano mayor (dicho por un hombre)',
    context:
      'Un hombre lo usa para dirigirse a otro hombre mayor cercano, en la familia, la universidad o el trabajo.',
  },
  {
    term: '언니',
    transliteration: 'Unnie / Eonni',
    country: 'korea',
    category: 'honorifics',
    meaning: 'Hermana mayor (dicho por una mujer)',
    context:
      'Una mujer lo usa para dirigirse a otra mujer mayor cercana, con calidez y confianza.',
  },
  {
    term: '누나',
    transliteration: 'Noona',
    country: 'korea',
    category: 'honorifics',
    meaning: 'Hermana mayor (dicho por un hombre)',
    context:
      'Un hombre lo usa para dirigirse a una mujer mayor cercana. Frecuente en tramas con diferencia de edad ("noona romance").',
  },
  {
    term: '선배 · 후배',
    transliteration: 'Sunbae · Hoobae',
    country: 'korea',
    category: 'university',
    meaning: 'Senior · Junior (en la universidad o el trabajo)',
    context:
      'Sistema de jerarquía por antigüedad: el sunbae guía y protege al hoobae, que a su vez le debe respeto. Muy presente en dramas de campus.',
  },
  {
    term: '애교',
    transliteration: 'Aegyo',
    country: 'korea',
    category: 'fandom',
    meaning: 'Comportamiento tierno y exagerado para mostrar cariño',
    context:
      'Voz aguda, pucheros y gestos infantiles usados para pedir algo, hacer las paces o simplemente ser encantador con la pareja o los fans.',
  },

  // ─── Japón ─────────────────────────────────────────────────────────
  {
    term: '先輩 · 後輩',
    transliteration: 'Senpai · Kōhai',
    country: 'japan',
    category: 'university',
    meaning: 'Senior · Junior (en la escuela o el trabajo)',
    context:
      'El senpai (con más experiencia) guía y protege al kōhai (más nuevo). Base de muchísimas tramas escolares BL/GL japonesas.',
  },
  {
    term: '-くん · -ちゃん · -さん · -さま',
    transliteration: '-kun · -chan · -san · -sama',
    country: 'japan',
    category: 'honorifics',
    meaning: 'Sufijos de tratamiento según cercanía y respeto',
    context:
      '-kun: informal, típicamente hacia varones jóvenes. -chan: cariñoso/infantil. -san: neutral y respetuoso (el "por defecto"). -sama: respeto máximo, casi reverencial.',
    commonMistake:
      'Usar "-san" para todos por igual pierde el matiz: cambiar de "-san" a "-kun/-chan" en una serie suele marcar que la relación se volvió más cercana.',
  },
  {
    term: '幼馴染',
    transliteration: 'Osananajimi',
    country: 'japan',
    category: 'relationships',
    meaning: 'Amigo/a de la infancia',
    context:
      'Trope narrativo muy común: la pareja se conoce desde niños, lo que suele generar tensión entre "amistad de toda la vida" y "amor romántico".',
  },
  {
    term: 'やおい',
    transliteration: 'Yaoi',
    country: 'japan',
    category: 'genreConcepts',
    meaning: 'Término histórico japonés para historias BL',
    context:
      'Surgió en el fandom de dōjinshi (fanzines) de los años 70-80. Hoy en Japón se usa más "BL" para obras comerciales publicadas, mientras "Yaoi" quedó asociado a contenido de fans.',
  },
  {
    term: '攻め · 受け',
    transliteration: 'Seme · Uke',
    country: 'japan',
    category: 'genreConcepts',
    meaning: 'Rol "activo" · rol "receptivo" en una pareja BL',
    context:
      'Convención narrativa japonesa para describir la dinámica entre los dos personajes de una pareja. Es terminología de género y narrativa, no una descripción literal de la relación.',
  },

  // ─── General / Fandom ──────────────────────────────────────────────
  {
    term: 'GL (Girls’ Love)',
    country: 'general',
    category: 'genreConcepts',
    meaning: 'Dramas románticos entre mujeres (Sáfico / Lésbico)',
    context:
      'Crecimiento exponencial en la industria asiática con éxitos como GAP The Series, 23.5, Blank, The Secret of Us y Pluto.',
  },
  {
    term: 'Uncut',
    country: 'general',
    category: 'genreConcepts',
    meaning: 'Versión extendida sin censura televisiva',
    context:
      'Versión que incluye escenas íntimas o de acción completas, habitualmente disponible en plataformas de streaming VIP (iQIYI, GagaOOLala, WeTV).',
  },
  {
    term: 'Skinship',
    country: 'general',
    category: 'relationships',
    meaning: 'Contacto físico afectivo entre pareja o amigos cercanos',
    context:
      'Tomarse de la mano, abrazos, apoyar la cabeza en el hombro. Término muy usado en reseñas y fandom para describir la química física entre protagonistas.',
  },
  {
    term: 'OTP',
    country: 'general',
    category: 'fandom',
    meaning: 'One True Pairing — "La" pareja favorita indiscutible',
    context:
      'La pareja que una persona del fandom considera, por encima de cualquier otra, la que "debería" estar junta.',
  },
  {
    term: 'Ship / Shippear',
    country: 'general',
    category: 'fandom',
    meaning: 'Desear o imaginar una relación romántica entre dos personajes',
    context:
      'Del inglés "relationSHIP". Se puede shippear a personajes de una serie, o incluso a los actores que los interpretan (con los límites éticos que eso implica).',
  },
  {
    term: 'Fanservice',
    country: 'general',
    category: 'fandom',
    meaning: 'Momento incluido para complacer a los fans',
    context:
      'Una mirada, cercanía física o guiño a la pareja que existe más para el disfrute del público que por necesidad de la trama.',
  },
  {
    term: 'Slow burn',
    country: 'general',
    category: 'fandom',
    meaning: 'Historia de amor que se desarrolla muy gradualmente',
    context:
      'Opuesto a una relación inmediata: el vínculo romántico crece de a poco a lo largo de toda la serie, capítulo a capítulo.',
  },
  {
    term: 'Second lead syndrome',
    country: 'general',
    category: 'fandom',
    meaning:
      'Cuando el público termina prefiriendo al personaje secundario romántico',
    context:
      'El "segundo galán" (o "segunda galana") gana el corazón de la audiencia por sobre el protagonista principal, aunque la trama no vaya a emparejarlo con el lead.',
  },
];
