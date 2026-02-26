import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * All countries with their canonical Spanish name and ISO 3166-1 alpha-2 code.
 * One entry per country (no variants/aliases).
 */
const ALL_COUNTRIES: { name: string; code: string }[] = [
  // Asia Oriental
  { name: 'China', code: 'cn' },
  { name: 'Corea del Norte', code: 'kp' },
  { name: 'Corea del Sur', code: 'kr' },
  { name: 'Japón', code: 'jp' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Taiwán', code: 'tw' },
  { name: 'Hong Kong', code: 'hk' },
  { name: 'Macao', code: 'mo' },

  // Sudeste Asiático
  { name: 'Myanmar', code: 'mm' },
  { name: 'Brunéi', code: 'bn' },
  { name: 'Camboya', code: 'kh' },
  { name: 'Filipinas', code: 'ph' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Laos', code: 'la' },
  { name: 'Malasia', code: 'my' },
  { name: 'Singapur', code: 'sg' },
  { name: 'Tailandia', code: 'th' },
  { name: 'Timor Oriental', code: 'tl' },
  { name: 'Vietnam', code: 'vn' },

  // Asia Meridional
  { name: 'Afganistán', code: 'af' },
  { name: 'Bangladés', code: 'bd' },
  { name: 'Bután', code: 'bt' },
  { name: 'India', code: 'in' },
  { name: 'Maldivas', code: 'mv' },
  { name: 'Nepal', code: 'np' },
  { name: 'Pakistán', code: 'pk' },
  { name: 'Sri Lanka', code: 'lk' },

  // Asia Central
  { name: 'Kazajistán', code: 'kz' },
  { name: 'Kirguistán', code: 'kg' },
  { name: 'Tayikistán', code: 'tj' },
  { name: 'Turkmenistán', code: 'tm' },
  { name: 'Uzbekistán', code: 'uz' },

  // Asia Occidental / Medio Oriente
  { name: 'Arabia Saudita', code: 'sa' },
  { name: 'Baréin', code: 'bh' },
  { name: 'Catar', code: 'qa' },
  { name: 'Chipre', code: 'cy' },
  { name: 'Emiratos Árabes Unidos', code: 'ae' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Irak', code: 'iq' },
  { name: 'Irán', code: 'ir' },
  { name: 'Israel', code: 'il' },
  { name: 'Jordania', code: 'jo' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Líbano', code: 'lb' },
  { name: 'Omán', code: 'om' },
  { name: 'Palestina', code: 'ps' },
  { name: 'Siria', code: 'sy' },
  { name: 'Turquía', code: 'tr' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Armenia', code: 'am' },
  { name: 'Azerbaiyán', code: 'az' },

  // Europa Occidental
  { name: 'Alemania', code: 'de' },
  { name: 'Austria', code: 'at' },
  { name: 'Bélgica', code: 'be' },
  { name: 'Francia', code: 'fr' },
  { name: 'Irlanda', code: 'ie' },
  { name: 'Liechtenstein', code: 'li' },
  { name: 'Luxemburgo', code: 'lu' },
  { name: 'Mónaco', code: 'mc' },
  { name: 'Países Bajos', code: 'nl' },
  { name: 'Reino Unido', code: 'gb' },
  { name: 'Suiza', code: 'ch' },

  // Europa Meridional
  { name: 'Albania', code: 'al' },
  { name: 'Andorra', code: 'ad' },
  { name: 'Bosnia y Herzegovina', code: 'ba' },
  { name: 'Croacia', code: 'hr' },
  { name: 'Eslovenia', code: 'si' },
  { name: 'España', code: 'es' },
  { name: 'Grecia', code: 'gr' },
  { name: 'Italia', code: 'it' },
  { name: 'Macedonia del Norte', code: 'mk' },
  { name: 'Malta', code: 'mt' },
  { name: 'Montenegro', code: 'me' },
  { name: 'Portugal', code: 'pt' },
  { name: 'San Marino', code: 'sm' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Vaticano', code: 'va' },

  // Europa Septentrional
  { name: 'Dinamarca', code: 'dk' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Finlandia', code: 'fi' },
  { name: 'Islandia', code: 'is' },
  { name: 'Letonia', code: 'lv' },
  { name: 'Lituania', code: 'lt' },
  { name: 'Noruega', code: 'no' },
  { name: 'Suecia', code: 'se' },

  // Europa Oriental
  { name: 'Bielorrusia', code: 'by' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Eslovaquia', code: 'sk' },
  { name: 'Hungría', code: 'hu' },
  { name: 'Moldavia', code: 'md' },
  { name: 'Polonia', code: 'pl' },
  { name: 'República Checa', code: 'cz' },
  { name: 'Rumania', code: 'ro' },
  { name: 'Rusia', code: 'ru' },
  { name: 'Ucrania', code: 'ua' },
  { name: 'Kosovo', code: 'xk' },

  // América del Norte
  { name: 'Canadá', code: 'ca' },
  { name: 'Estados Unidos', code: 'us' },
  { name: 'México', code: 'mx' },

  // Centroamérica y Caribe
  { name: 'Belice', code: 'bz' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Cuba', code: 'cu' },
  { name: 'El Salvador', code: 'sv' },
  { name: 'Guatemala', code: 'gt' },
  { name: 'Haití', code: 'ht' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Nicaragua', code: 'ni' },
  { name: 'Panamá', code: 'pa' },
  { name: 'Puerto Rico', code: 'pr' },
  { name: 'República Dominicana', code: 'do' },
  { name: 'Trinidad y Tobago', code: 'tt' },
  { name: 'Bahamas', code: 'bs' },
  { name: 'Barbados', code: 'bb' },
  { name: 'Dominica', code: 'dm' },
  { name: 'Granada', code: 'gd' },
  { name: 'San Cristóbal y Nieves', code: 'kn' },
  { name: 'Santa Lucía', code: 'lc' },
  { name: 'San Vicente y las Granadinas', code: 'vc' },
  { name: 'Antigua y Barbuda', code: 'ag' },

  // América del Sur
  { name: 'Argentina', code: 'ar' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Brasil', code: 'br' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colombia', code: 'co' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Guyana', code: 'gy' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Perú', code: 'pe' },
  { name: 'Surinam', code: 'sr' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Venezuela', code: 've' },

  // África del Norte
  { name: 'Argelia', code: 'dz' },
  { name: 'Egipto', code: 'eg' },
  { name: 'Libia', code: 'ly' },
  { name: 'Marruecos', code: 'ma' },
  { name: 'Mauritania', code: 'mr' },
  { name: 'Túnez', code: 'tn' },
  { name: 'Sudán', code: 'sd' },

  // África Occidental
  { name: 'Benín', code: 'bj' },
  { name: 'Burkina Faso', code: 'bf' },
  { name: 'Cabo Verde', code: 'cv' },
  { name: 'Costa de Marfil', code: 'ci' },
  { name: 'Gambia', code: 'gm' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Guinea', code: 'gn' },
  { name: 'Guinea-Bisáu', code: 'gw' },
  { name: 'Liberia', code: 'lr' },
  { name: 'Malí', code: 'ml' },
  { name: 'Níger', code: 'ne' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Sierra Leona', code: 'sl' },
  { name: 'Togo', code: 'tg' },

  // África Oriental
  { name: 'Burundi', code: 'bi' },
  { name: 'Comoras', code: 'km' },
  { name: 'Eritrea', code: 'er' },
  { name: 'Etiopía', code: 'et' },
  { name: 'Kenia', code: 'ke' },
  { name: 'Madagascar', code: 'mg' },
  { name: 'Malaui', code: 'mw' },
  { name: 'Mauricio', code: 'mu' },
  { name: 'Mozambique', code: 'mz' },
  { name: 'Ruanda', code: 'rw' },
  { name: 'Seychelles', code: 'sc' },
  { name: 'Somalia', code: 'so' },
  { name: 'Sudán del Sur', code: 'ss' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Yibuti', code: 'dj' },
  { name: 'Zimbabue', code: 'zw' },

  // África Central
  { name: 'Camerún', code: 'cm' },
  { name: 'Chad', code: 'td' },
  { name: 'República del Congo', code: 'cg' },
  { name: 'República Democrática del Congo', code: 'cd' },
  { name: 'Gabón', code: 'ga' },
  { name: 'Guinea Ecuatorial', code: 'gq' },
  { name: 'República Centroafricana', code: 'cf' },
  { name: 'Santo Tomé y Príncipe', code: 'st' },

  // África Meridional
  { name: 'Angola', code: 'ao' },
  { name: 'Botsuana', code: 'bw' },
  { name: 'Lesoto', code: 'ls' },
  { name: 'Namibia', code: 'na' },
  { name: 'Esuatini', code: 'sz' },
  { name: 'Sudáfrica', code: 'za' },
  { name: 'Zambia', code: 'zm' },

  // Oceanía
  { name: 'Australia', code: 'au' },
  { name: 'Fiyi', code: 'fj' },
  { name: 'Kiribati', code: 'ki' },
  { name: 'Islas Marshall', code: 'mh' },
  { name: 'Micronesia', code: 'fm' },
  { name: 'Nauru', code: 'nr' },
  { name: 'Nueva Zelanda', code: 'nz' },
  { name: 'Palaos', code: 'pw' },
  { name: 'Papúa Nueva Guinea', code: 'pg' },
  { name: 'Samoa', code: 'ws' },
  { name: 'Islas Salomón', code: 'sb' },
  { name: 'Tonga', code: 'to' },
  { name: 'Tuvalu', code: 'tv' },
  { name: 'Vanuatu', code: 'vu' },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const { name, code } of ALL_COUNTRIES) {
    const existing = await prisma.country.findUnique({ where: { name } });

    if (existing) {
      if (existing.code !== code) {
        await prisma.country.update({
          where: { id: existing.id },
          data: { code },
        });
        console.log(`Updated "${name}" code: ${existing.code} -> ${code}`);
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Check if code is already used by another country
      const codeExists = await prisma.country.findUnique({ where: { code } });
      if (codeExists) {
        console.log(
          `Skipped "${name}" - code "${code}" already used by "${codeExists.name}"`
        );
        skipped++;
        continue;
      }

      await prisma.country.create({ data: { name, code } });
      console.log(`Created "${name}" (${code})`);
      created++;
    }
  }

  const total = await prisma.country.count();
  console.log(
    `\nDone. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}. Total in DB: ${total}`
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
