// Hyperdrive para la base (lo usa .github/workflows/deploy.yml).
//
// Sin Hyperdrive, cada consulta del Worker abre una conexion TCP+TLS nueva al
// pooler de Supabase (ver maxUses en src/lib/database.ts): son varios viajes
// de ida y vuelta antes de la primera consulta. Hyperdrive mantiene las
// conexiones abiertas cerca de la base y el Worker se conecta a el en el
// mismo datacenter. Viene incluido en Workers Paid, sin costo extra.
//
// Que hace este script:
// 1. Busca la configuracion "mundobl-db" en la cuenta (API de Cloudflare).
// 2. Si no existe, la crea con DIRECT_URL (o DATABASE_URL si falla), con la
//    cache de consultas APAGADA: Hyperdrive no invalida la cache cuando se
//    escribe, y MundoBL necesita leer lo que el usuario acaba de marcar.
// 3. Agrega el binding HYPERDRIVE a wrangler.jsonc (solo en el runner del
//    deploy; el archivo del repo no cambia).
//
// Si algo falla (por ejemplo el token no tiene permiso de Hyperdrive), avisa
// en el resumen del deploy y sigue SIN Hyperdrive: el sitio funciona igual que
// antes, conectando directo a Supabase (cloudflare/worker.ts).
//
// Uso: node scripts/ensure-hyperdrive.mjs <build-env.json>
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const CONFIG_NAME = 'mundobl-db';
const WRANGLER_FILE = new URL('../wrangler.jsonc', import.meta.url);

const [envFile] = process.argv.slice(2);
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;

function summary(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  }
}

function skip(reason) {
  summary(
    `⚠️ Hyperdrive no activado: ${reason}. El sitio usa la conexion directa a Supabase.`
  );
  process.exit(0);
}

async function api(path, init = {}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/hyperdrive${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
    }
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const detail = (body.errors ?? []).map((e) => e.message).join('; ');
    const error = new Error(
      `${response.status} ${detail || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }
  return body.result;
}

/** postgres://user:pass@host:port/db -> origen de Hyperdrive. */
function toOrigin(connectionString) {
  const url = new URL(connectionString);
  return {
    scheme: 'postgres',
    host: url.hostname,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1) || 'postgres'),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

async function findOrCreate(env) {
  const configs = await api('/configs');
  const existing = configs.find((config) => config.name === CONFIG_NAME);
  if (existing) return existing.id;

  const candidates = [env.DIRECT_URL, env.DATABASE_URL].filter(Boolean);
  let lastError;
  for (const connectionString of candidates) {
    try {
      const created = await api('/configs', {
        method: 'POST',
        body: JSON.stringify({
          name: CONFIG_NAME,
          origin: toOrigin(connectionString),
          caching: { disabled: true },
        }),
      });
      summary(
        `Hyperdrive "${CONFIG_NAME}" creado (${toOrigin(connectionString).host}).`
      );
      return created.id;
    } catch (error) {
      // Cloudflare prueba la conexion antes de crear; si un host no responde
      // (por ejemplo, solo IPv6) se intenta con el siguiente.
      lastError = error;
      console.log(`No se pudo crear con un candidato: ${error.message}`);
    }
  }
  throw lastError ?? new Error('sin DATABASE_URL');
}

function addBinding(id) {
  const source = readFileSync(WRANGLER_FILE, 'utf8');
  if (source.includes('"hyperdrive"')) return;
  const end = source.lastIndexOf('}');
  const binding = `  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "${id}" }],\n`;
  writeFileSync(
    WRANGLER_FILE,
    `${source.slice(0, end)}${binding}${source.slice(end)}`
  );
}

if (!envFile) {
  console.error('Uso: node scripts/ensure-hyperdrive.mjs <build-env.json>');
  process.exit(1);
}
if (!token || !account)
  skip('faltan CLOUDFLARE_API_TOKEN o CLOUDFLARE_ACCOUNT_ID');

const env = JSON.parse(readFileSync(envFile, 'utf8'));

try {
  const id = await findOrCreate(env);
  addBinding(id);
  summary(`✅ Hyperdrive activo (${CONFIG_NAME}).`);
} catch (error) {
  if (error.status === 401 || error.status === 403) {
    skip(
      'el token CLOUDFLARE_API_TOKEN no tiene permiso "Hyperdrive: Edit" (ver docs/deploy-cloudflare.md, seccion Hyperdrive)'
    );
  }
  skip(`error de la API (${error.message})`);
}
