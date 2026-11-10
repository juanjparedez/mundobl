// Arma el entorno de producción para el deploy (.github/workflows/deploy.yml).
//
// Fuentes, de menor a mayor prioridad:
// 1. MUNDOBL_ENV: un .env completo pegado como un solo secret (opcional).
// 2. ALL_SECRETS: `toJSON(secrets)` del workflow, o sea cada secret del repo
//    cargado por separado en GitHub (DATABASE_URL, GOOGLE_CLIENT_ID, ...).
//
// Salidas (JSON, no .env: wrangler expande $VAR en un .env y algunas claves
// pueden tener "$" literales):
// - argv[2]: todo, para el build (NEXT_PUBLIC_* se inlinea ahi).
// - argv[3]: los secrets del Worker (sin NEXT_PUBLIC_*).
import { writeFileSync } from 'node:fs';
import { parse } from 'dotenv';

const [buildFile, workerFile] = process.argv.slice(2);
if (!buildFile || !workerFile) {
  console.error(
    'Uso: node scripts/prepare-production-env.mjs <build.json> <worker.json>'
  );
  process.exit(1);
}

// Secrets del repo que son del deploy, no de la app.
const NOT_APP = new Set([
  'github_token',
  'MUNDOBL_ENV',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'VERCEL_TOKEN',
]);
// Solo existen en Vercel (o los pone su CLI); en Cloudflare no sirven.
const VERCEL_ONLY = /^(VERCEL|MAINTENANCE_VERCEL_|NEXT_PUBLIC_VERCEL_)/;
// `vercel env pull` deja este texto en las variables "sensitive".
const PLACEHOLDER = '[SENSITIVE]';

const fromEnvFile = parse(process.env.MUNDOBL_ENV ?? '');
const fromSecrets = JSON.parse(process.env.ALL_SECRETS || '{}');

const env = {};
for (const [key, value] of Object.entries({ ...fromEnvFile, ...fromSecrets })) {
  if (NOT_APP.has(key) || VERCEL_ONLY.test(key)) continue;
  if (typeof value !== 'string' || value === '' || value === PLACEHOLDER) {
    continue;
  }
  env[key] = value;
}

// Sin estas el sitio no levanta (base, login, crons).
const REQUIRED = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CRON_SECRET',
];
const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(
    `Faltan valores (en MUNDOBL_ENV o como secrets sueltos): ${missing.join(', ')}`
  );
  process.exit(1);
}

const worker = Object.fromEntries(
  Object.entries(env).filter(([key]) => !key.startsWith('NEXT_PUBLIC_'))
);
writeFileSync(buildFile, JSON.stringify(env), { mode: 0o600 });
writeFileSync(workerFile, JSON.stringify(worker), { mode: 0o600 });
console.log(`Variables cargadas: ${Object.keys(env).sort().join(', ')}`);
