// Convierte un .env en el JSON que acepta `wrangler deploy --secrets-file`.
// JSON y no .env porque wrangler expande $VAR dentro de un .env, y algunas
// claves (URLs de base, secretos) pueden tener "$" literales.
// Uso: node scripts/env-to-secrets-json.mjs production.env > secrets.json
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/env-to-secrets-json.mjs <archivo .env>');
  process.exit(1);
}

const env = parse(readFileSync(file));

// Sin estas el sitio no levanta (base, login, crons). `vercel env pull` deja
// vacias las variables marcadas como "sensitive": hay que cargarlas a mano.
const REQUIRED = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CRON_SECRET',
];
const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`Faltan valores en el .env: ${missing.join(', ')}`);
  process.exit(1);
}

const entries = Object.entries(env).filter(
  // NEXT_PUBLIC_* ya quedo inlineado en el build; vacios no aportan nada.
  ([key, value]) => value !== '' && !key.startsWith('NEXT_PUBLIC_')
);
process.stdout.write(JSON.stringify(Object.fromEntries(entries)));
