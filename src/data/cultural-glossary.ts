export interface GlossaryTerm {
  term: string;
  transliteration?: string;
  category:
    | 'Honoríficos'
    | 'Relaciones'
    | 'Género y Conceptos'
    | 'Cultura Universitaria';
  meaning: string;
  context: string;
  commonMistake?: string;
  examples?: string;
}

export const CULTURAL_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'แฟน',
    transliteration: 'Faen',
    category: 'Relaciones',
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
    category: 'Honoríficos',
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
    category: 'Honoríficos',
    meaning: 'Hermano menor / Persona menor',
    context:
      'Prefijo cariñoso y protector que usa alguien mayor para dirigirse a una persona más joven.',
    examples: 'N’Gun, N’Pat, N’Tian',
  },
  {
    term: 'คุณ',
    transliteration: 'Khun',
    category: 'Honoríficos',
    meaning: 'Señor / Señora / Usted (Tratamiento formal de respeto)',
    context:
      'Se usa en entornos laborales, familias aristocráticas o cuando dos personas aún no tienen confianza.',
    examples: 'Khun Sam, Khun Nueng',
  },
  {
    term: 'เฮีย',
    transliteration: 'Hia',
    category: 'Honoríficos',
    meaning: 'Hermano mayor (en familias tailandesas de ascendencia china)',
    context:
      'Equivalente a P’, pero con fuerte raíz cultural teochew / china. Denota afecto y protección.',
    examples: 'Hia Lian (en Cutie Pie), Hia Yi',
  },
  {
    term: 'ที่รัก',
    transliteration: 'Ti-lak',
    category: 'Relaciones',
    meaning: 'Mi amor / Querido / Cariño',
    context: 'Tratamiento íntimo y romántico entre parejas.',
  },
  {
    term: 'SOTUS',
    category: 'Cultura Universitaria',
    meaning: 'Seniority, Order, Tradition, Unity, Spirit',
    context:
      'Sistema tradicional de bienvenida y jerarquía universitaria en Tailandia (frecuente en facultades de Ingeniería). Central en series como SOTUS The Series.',
  },
  {
    term: 'ซีรีส์วาย',
    transliteration: 'Series Y',
    category: 'Género y Conceptos',
    meaning: 'Dramas BL (Boys’ Love)',
    context:
      'En Tailandia, el género BL se conoce como "Series Y" (por la letra Y del término japonés Yaoi).',
  },
  {
    term: 'GL (Girls’ Love)',
    category: 'Género y Conceptos',
    meaning: 'Dramas románticos entre mujeres (Sáfico / Lésbico)',
    context:
      'Crecimiento exponencial en la industria asiática con éxitos como GAP The Series, 23.5, Blank, The Secret of Us y Pluto.',
  },
  {
    term: 'Uncut',
    category: 'Género y Conceptos',
    meaning: 'Versión extendida sin censura televisiva',
    context:
      'Versión que incluye escenas íntimas o de acción completas, habitualmente disponible en plataformas de streaming VIP (iQIYI, GagaOOLala, WeTV).',
  },
];
