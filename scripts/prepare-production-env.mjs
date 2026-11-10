// Arma el entorno de producción para el deploy (.github/workflows/deploy.yml).
//
// Fuentes, de menor a mayor prioridad:
// 1. MUNDOBL_ENV: un .env completo pegado como un solo secret (opcional).
// 2. Secrets sueltos del repo (DATABASE_URL, GOOGLE_CLIENT_ID, ...), que el
//    workflow pasa por nombre como variables de entorno. La lista es APP_KEYS.
//
// Salidas (JSON, no .env: wrangler expande $VAR en un .env y algunas claves
// pueden tener "$" literales):
// - argv[2]: todo, para el build (NEXT_PUBLIC_* se inlinea ahi).
// - argv[3]: los secrets del Worker (sin NEXT_PUBLIC_*).
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'dotenv';

const [buildFile, workerFile] = process.argv.slice(2);
if (!buildFile || !workerFile) {
  console.error(
    'Uso: node scripts/prepare-production-env.mjs <build.json> <worker.json>'
  );
  process.exit(1);
}

// Variables de la app que pueden venir como secret suelto. El env del paso
// "Cargar el entorno de producción" en deploy.yml tiene que listar las mismas.
const APP_KEYS = [
  'ADMIN_EMAILS',
  'AUTH_SECRET',
  'CRON_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'GEMINI_API_KEY',
  'GEMINI_MODELS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN',
  'NEXT_PUBLIC_DAILYMOTION_PLAYER_ID',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'PROJECT_GITHUB_URL',
  'PROJECT_SUPABASE_URL',
  'R2_ACCESS_KEY_ID',
  'R2_ACCOUNT_ID',
  'R2_BUCKET',
  'R2_PUBLIC_HOST',
  'R2_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
  'RUNTIME_FREEZE_AUTO_ENABLED',
  'RUNTIME_FREEZE_COOLDOWN_MS',
  'RUNTIME_FREEZE_FORCE',
  'RUNTIME_FREEZE_HIT_THRESHOLD',
  'RUNTIME_FREEZE_WINDOW_MS',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'VIMEO_ACCESS_TOKEN',
  'VIMEO_CLIENT_ID',
  'YOUTUBE_API_KEY',
];
// Solo existen en Vercel (o los pone su CLI); en Cloudflare no sirven.
const VERCEL_ONLY = /^(VERCEL|MAINTENANCE_VERCEL_|NEXT_PUBLIC_VERCEL_)/;
// `vercel env pull` deja este texto en las variables "sensitive".
const PLACEHOLDER = '[SENSITIVE]';

// Si deploy.yml y APP_KEYS se desfasan, un secret cargado en GitHub nunca
// llegaria al sitio sin que nadie se entere. Mejor cortar aca.
const workflow = readFileSync(
  new URL('../.github/workflows/deploy.yml', import.meta.url),
  'utf8'
);
const inWorkflow = new Set(
  [...workflow.matchAll(/^\s+([A-Z0-9_]+): \$\{\{ secrets\.\1 \}\}$/gm)].map(
    (match) => match[1]
  )
);
const notInWorkflow = APP_KEYS.filter((key) => !inWorkflow.has(key));
if (notInWorkflow.length > 0) {
  console.error(
    `deploy.yml no pasa estos secrets (agregarlos al env del paso): ${notInWorkflow.join(', ')}`
  );
  process.exit(1);
}

const fromEnvFile = parse(process.env.MUNDOBL_ENV ?? '');
const fromSecrets = Object.fromEntries(
  APP_KEYS.map((key) => [key, process.env[key] ?? '']).filter(
    ([, value]) => value !== ''
  )
);

const env = {};
for (const [key, value] of Object.entries({ ...fromEnvFile, ...fromSecrets })) {
  if (key === 'MUNDOBL_ENV' || VERCEL_ONLY.test(key)) continue;
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
