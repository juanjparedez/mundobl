import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import pg from 'pg';

const project = fileURLToPath(new URL('../', import.meta.url));
const envFile = new URL('../.env', import.meta.url);
const savedEnv = existsSync(envFile) ? parse(readFileSync(envFile)) : {};
const directUrl = savedEnv.DIRECT_URL || process.env.DIRECT_URL;
if (!directUrl)
  throw new Error('Falta DIRECT_URL para aplicar las migraciones.');

// Datos que una migracion no puede cargar en SQL porque dependen de logica
// en TypeScript. Cada script corre solo la vez que se aplica su migracion
// (y debe ser idempotente por si se corre a mano).
const DATA_STEPS = [
  {
    migration: '20261028040000_user_achievements',
    script: 'scripts/backfill-achievements.ts',
  },
];

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: project,
    env: { ...process.env, DIRECT_URL: directUrl },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

async function appliedSince(startedAt) {
  const client = new pg.Client({ connectionString: directUrl });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at >= $1 AND rolled_back_at IS NULL`,
      [startedAt]
    );
    return new Set(rows.map((row) => row.migration_name));
  } finally {
    await client.end();
  }
}

// La hora la pone la base, asi no depende del reloj de esta maquina.
async function databaseNow() {
  const client = new pg.Client({ connectionString: directUrl });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT NOW() AS now');
    return rows[0].now;
  } finally {
    await client.end();
  }
}

const startedAt = await databaseNow();
// deploy only executes versioned SQL. Never use db push on the shared database.
const status = run(['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
if (status !== 0) {
  process.exitCode = status;
} else {
  const applied = await appliedSince(startedAt);
  for (const step of DATA_STEPS.filter((s) => applied.has(s.migration))) {
    console.log(`\n${step.migration}: corriendo ${step.script}`);
    const stepStatus = run([
      'node_modules/tsx/dist/cli.mjs',
      step.script,
      '--apply',
    ]);
    if (stepStatus !== 0) {
      console.error(
        `${step.script} fallo. La migracion ya quedo aplicada: corregir y correr a mano con npx tsx ${step.script} --apply`
      );
      process.exitCode = stepStatus;
      break;
    }
  }
}
