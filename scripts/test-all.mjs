#!/usr/bin/env node
// Corre localmente las mismas verificaciones que CI (.github/workflows/tracking.yml
// llama a este mismo script, asi la lista no se desincroniza).
//
//   npm run test:all            todo: tipos, lint, prettier, migraciones,
//                               regresiones contra Postgres descartable,
//                               UI con Playwright, build y app completa
//   npm run test:all -- --fast  solo tipos, lint y prettier (~1 min)
//   npm run test:all -- --from=ui:test-history-cards
//                               retoma desde un paso (despues de arreglar)
//   npm run test:all -- --list  muestra los pasos
//
// Base de datos:
//   - por defecto levanta un postgres:16-alpine en Docker (127.0.0.1:55433),
//     en memoria, y lo borra al terminar. Requiere Docker Desktop corriendo.
//   - MUNDOBL_TEST_DB=external usa el DATABASE_URL ya exportado (CI usa el
//     service container). Igual tiene que ser 127.0.0.1:55433/mundobl_replay.
//
// Nunca usa los datos de .env: las claves de .env* se vacian en los procesos
// hijos para que el build o el servidor de prueba no hablen con produccion.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const args = process.argv.slice(2);
const fast = args.includes('--fast');
const listOnly = args.includes('--list');
const fromStep = args.find((a) => a.startsWith('--from='))?.slice(7);
const external = process.env.MUNDOBL_TEST_DB === 'external';

const CONTAINER = 'mundobl-test-pg';
const DB_URL = external
  ? (process.env.DATABASE_URL ?? '')
  : 'postgresql://mundobl:mundobl@127.0.0.1:55433/mundobl_replay';
const RESTORE_URL = DB_URL.replace(
  /\/mundobl_replay(\?|$)/,
  '/mundobl_restore$1'
);
const APP_PORT = 3223;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const logDir = path.join(root, 'test-results', 'test-all');

const bin = (rel) => path.join(root, 'node_modules', rel);
const TSX = bin('tsx/dist/cli.mjs');
const PRISMA = bin('prisma/build/index.js');
const NEXT = bin('next/dist/bin/next');
const PLAYWRIGHT = bin('playwright/cli.js');

// Mismo orden que tenia tracking.yml.
const tsxTests = [
  'build-metadata',
  'catalog-payload',
  'latest-novedades',
  'navigation',
  'outbound-links',
  'external-episode-source',
];
const trackingTests = [
  'tracking-backup',
  'watching-collection',
  'profile-chapters',
  'tracking-statistics',
  'tracking-insights',
  'insight-distributions',
  'progress',
  'tracking-database',
  'tracking-history',
  'series-tracking-status',
  'community-privacy',
  'community-statistics',
  'community-topics',
  'community-library',
  'community-moderation',
  'community-conversations',
  'community-metrics',
  'community-backup',
  'community-request',
  'watch-date',
  'writer-credits',
  'series-save',
  'series-curation',
  'watch-content-batch',
  'editorial-classification',
  'onboarding',
  'tracking-redesign',
  'airing-alerts',
  'achievements',
];
// [script, usa --import tsx]
const routeTests = [
  ['test-platform-audit.mjs', true],
  ['test-private-tracking-routes.mjs', true],
  ['test-activity-routes.mjs', true],
  ['test-info-block-privacy.mjs', true],
  ['test-editorial-routes.mjs', true],
  ['test-profile-watch-dates.mjs', true],
  ['test-tracking-insights-route.mjs', true],
  ['test-library-preferences.mjs', true],
  ['test-runtime-jobs.mjs', true],
  ['test-runtime-maintenance.mjs', false],
  ['test-news-translation.mjs', false],
  ['test-news-sources.mjs', false],
  ['test-contribution-boundary.mjs', false],
];
const uiTests = [
  ['test-player-recovery.mjs', false],
  ['test-editorial-ui.mjs', true],
  ['test-dashboard-mobile-flow.mjs', false],
  ['test-profile-list-count.mjs', false],
  ['test-tracking-insights-ui.mjs', false],
  ['test-runtime-maintenance-ui.mjs', false],
  ['test-history-cards.mjs', false],
  ['test-platform-guide.mjs', false],
  ['test-community-statistics-ui.mjs', false],
  ['test-community-flow.mjs', true],
  ['test-community-library-flow.mjs', true],
];
const appTests = [
  ['test-community-app.mjs', true],
  ['test-series-curation-ui.mjs', false],
  ['test-catalog-preview-ui.mjs', false],
  ['test-profile-app.mjs', true],
];

const node = (script, withTsx) => [
  process.execPath,
  [...(withTsx ? ['--import', 'tsx'] : []), path.join('scripts', script)],
];
const tsx = (script) => [process.execPath, [TSX, path.join('scripts', script)]];

const staticSteps = [
  { name: 'prisma-generate', cmd: [process.execPath, [PRISMA, 'generate']] },
  {
    name: 'type-check',
    cmd: [process.execPath, [bin('typescript/bin/tsc'), '--noEmit']],
  },
  {
    name: 'lint',
    cmd: [process.execPath, [bin('eslint/bin/eslint.js'), 'src/']],
  },
  {
    name: 'prettier',
    cmd: [
      process.execPath,
      [
        bin('prettier/bin/prettier.cjs'),
        '--check',
        '--log-level=warn',
        'src/**/*.{js,jsx,ts,tsx,json,css,scss,md}',
      ],
    ],
  },
];

const dbSteps = [
  { name: 'db:start', run: startDatabase },
  {
    name: 'migrate-deploy',
    cmd: [process.execPath, [PRISMA, 'migrate', 'deploy']],
  },
  {
    name: 'db:check',
    cmd: [
      process.execPath,
      [
        PRISMA,
        'migrate',
        'diff',
        '--from-config-datasource',
        '--to-schema',
        'prisma/schema.prisma',
        '--exit-code',
      ],
    ],
  },
  ...tsxTests.map((t) => ({ name: `test-${t}`, cmd: tsx(`test-${t}.ts`) })),
  { name: 'audit-locale-coverage', cmd: tsx('audit-locale-coverage.ts') },
  ...trackingTests.map((t) => ({
    name: `test-${t}`,
    cmd: tsx(`test-${t}.ts`),
  })),
  ...routeTests.map(([s, t]) => ({
    name: s.replace(/\.mjs$/, ''),
    cmd: node(s, t),
  })),
  { name: 'backup-restore', run: backupRestore },
];

const uiSteps = [
  {
    name: 'playwright-install',
    cmd: [
      process.execPath,
      [
        PLAYWRIGHT,
        'install',
        ...(process.env.CI && process.env.MUNDOBL_TEST_CONTAINER !== '1'
          ? ['--with-deps']
          : []),
        'chromium',
      ],
    ],
  },
  ...uiTests.map(([s, t]) => ({
    name: `ui:${s.replace(/\.mjs$/, '')}`,
    cmd: node(s, t),
  })),
];

const appSteps = [
  {
    name: 'build',
    cmd: [process.execPath, [NEXT, 'build', '--webpack']],
  },
  { name: 'app', run: appAgainstProductionServer },
];

const steps = fast
  ? staticSteps
  : [...staticSteps, ...dbSteps, ...uiSteps, ...appSteps];

if (listOnly) {
  for (const s of steps) console.log(s.name);
  process.exit(0);
}

// --- entorno ---------------------------------------------------------------

function envKeysFromDotenvFiles() {
  const keys = new Set();
  for (const file of fs.readdirSync(root)) {
    if (!/^\.env(\..+)?$/.test(file) || file === '.env.example') continue;
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const m of text.matchAll(/^\s*(?:export\s+)?([\w.-]+)\s*=/gm))
      keys.add(m[1]);
  }
  return keys;
}

const childEnv = { ...process.env };
// Una clave definida (aunque vacia) no se pisa con la de .env, ni en
// process.loadEnvFile (prisma.config.ts) ni en @next/env.
for (const key of envKeysFromDotenvFiles()) childEnv[key] = '';
Object.assign(childEnv, {
  DATABASE_URL: DB_URL,
  DIRECT_URL: DB_URL,
  AUTH_SECRET: 'integration-tests-only-not-a-production-secret',
  NEXT_TELEMETRY_DISABLED: '1',
  MUNDOBL_TEST_RUNTIME: '',
  SHADOW_DATABASE_URL: '',
});

// --- ejecucion -------------------------------------------------------------

function exec([command, commandArgs], extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: root,
      env: { ...childEnv, ...extraEnv },
      stdio: 'inherit',
    });
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    child.on('error', (err) => {
      console.error(err.message);
      resolve(1);
    });
  });
}

function docker(dockerArgs, opts = {}) {
  return spawnSync('docker', dockerArgs, {
    encoding: 'utf8',
    shell: isWindows,
    ...opts,
  });
}

let startedContainer = false;

async function waitForPostgres(url, seconds) {
  for (let i = 0; i < seconds; i++) {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      await client.query('select 1');
      await client.end();
      return true;
    } catch {
      await client.end().catch(() => {});
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

async function startDatabase() {
  if (!external) {
    if (docker(['info'], { stdio: 'ignore' }).status !== 0) {
      console.error(
        'Docker no esta corriendo. Abri Docker Desktop, o exporta MUNDOBL_TEST_DB=external con DATABASE_URL a 127.0.0.1:55433/mundobl_replay.'
      );
      return 1;
    }
    docker(['rm', '-f', CONTAINER], { stdio: 'ignore' });
    const run = docker(
      [
        'run',
        '-d',
        '--rm',
        '--name',
        CONTAINER,
        '-e',
        'POSTGRES_USER=mundobl',
        '-e',
        'POSTGRES_PASSWORD=mundobl',
        '-e',
        'POSTGRES_DB=mundobl_replay',
        '-p',
        '127.0.0.1:55433:5432',
        '--tmpfs',
        '/var/lib/postgresql/data',
        'postgres:16-alpine',
      ],
      { stdio: 'inherit' }
    );
    if (run.status !== 0) {
      console.error(
        'No se pudo levantar Postgres. ¿Esta ocupado el puerto 55433?'
      );
      return 1;
    }
    startedContainer = true;
  }
  // Durante el init del contenedor Postgres escucha solo por socket, asi que
  // conectar por TCP espera al servidor definitivo.
  if (!(await waitForPostgres(DB_URL, 60))) {
    console.error(`Postgres no respondio en ${DB_URL}`);
    return 1;
  }
  return 0;
}

function stopDatabase() {
  if (startedContainer) {
    docker(['rm', '-f', CONTAINER], { stdio: 'ignore' });
    startedContainer = false;
  }
}

async function backupRestore() {
  const admin = new pg.Client({ connectionString: DB_URL });
  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS mundobl_restore');
  await admin.query('CREATE DATABASE mundobl_restore');
  await admin.end();
  const restoreEnv = { DATABASE_URL: RESTORE_URL, DIRECT_URL: RESTORE_URL };
  const migrated = await exec(
    [process.execPath, [PRISMA, 'migrate', 'deploy']],
    restoreEnv
  );
  if (migrated !== 0) return migrated;
  return exec(tsx('test-backup-restore.ts'), {
    BACKUP_TEST_SOURCE_URL: DB_URL,
    BACKUP_TEST_TARGET_URL: RESTORE_URL,
  });
}

async function appAgainstProductionServer() {
  const appEnv = {
    AUTH_SECRET: 'community-full-app-test-only',
    AUTH_URL: APP_URL,
    NEXTAUTH_URL: APP_URL,
    GOOGLE_CLIENT_ID: 'local-test-client',
    GOOGLE_CLIENT_SECRET: 'local-test-secret',
    SERIES_FORM_TEST_BASE_URL: APP_URL,
    TEST_ISR: 'true',
  };
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, 'next-start.log');
  const log = fs.openSync(logPath, 'w');
  const server = spawn(
    process.execPath,
    [NEXT, 'start', '--hostname', '127.0.0.1', '--port', String(APP_PORT)],
    { cwd: root, env: { ...childEnv, ...appEnv }, stdio: ['ignore', log, log] }
  );
  try {
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      try {
        ready = (await fetch(`${APP_URL}/api/auth/session`)).ok;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!ready) {
      console.error(`El servidor no arranco. Log: ${logPath}`);
      return 1;
    }
    for (const [script, withTsx] of appTests) {
      console.log(`\n> app:${script}`);
      const code = await exec(node(script, withTsx), appEnv);
      if (code !== 0) {
        console.error(`Log del servidor: ${logPath}`);
        return code;
      }
    }
    return 0;
  } finally {
    server.kill();
    fs.closeSync(log);
  }
}

// --- main ------------------------------------------------------------------

function format(ms) {
  const s = Math.round(ms / 1000);
  return s >= 60
    ? `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
    : `${s}s`;
}

async function main() {
  let startIndex = 0;
  if (fromStep) {
    startIndex = steps.findIndex((s) => s.name === fromStep);
    if (startIndex < 0) {
      console.error(`Paso desconocido: ${fromStep}. Ver --list.`);
      return 1;
    }
  }
  const started = Date.now();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    // Al retomar, la base es nueva: hay que levantarla y migrarla igual.
    const required = ['prisma-generate', 'db:start', 'migrate-deploy'].includes(
      step.name
    );
    if (i < startIndex && !required) continue;
    const t0 = Date.now();
    console.log(`\n=== [${i + 1}/${steps.length}] ${step.name}`);
    const code = step.run ? await step.run() : await exec(step.cmd);
    if (code !== 0) {
      console.error(
        `\nFALLO en ${step.name} (${format(Date.now() - t0)}).` +
          `\nRetomar desde aca: npm run test:all -- --from=${step.name}`
      );
      return code;
    }
  }
  console.log(
    `\nTodo verde: ${steps.length} pasos en ${format(Date.now() - started)}.`
  );
  return 0;
}

const cleanup = () => stopDatabase();
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

let exitCode = 1;
try {
  exitCode = await main();
} finally {
  cleanup();
}
process.exit(exitCode);
