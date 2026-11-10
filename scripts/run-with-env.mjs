// Corre un comando con las variables de un JSON sumadas al entorno.
// Uso: node scripts/run-with-env.mjs <env.json> <comando> [args...]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [envFile, command, ...args] = process.argv.slice(2);
if (!envFile || !command) {
  console.error(
    'Uso: node scripts/run-with-env.mjs <env.json> <comando> [args...]'
  );
  process.exit(1);
}

const extra = JSON.parse(readFileSync(envFile, 'utf8'));
const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: { ...process.env, ...extra },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
