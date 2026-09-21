import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const project = fileURLToPath(new URL('../', import.meta.url));
const envFile = new URL('../.env', import.meta.url);
const savedEnv = existsSync(envFile) ? parse(readFileSync(envFile)) : {};
const directUrl = savedEnv.DIRECT_URL || process.env.DIRECT_URL;
if (!directUrl)
  throw new Error('Falta DIRECT_URL para aplicar las migraciones.');

// deploy only executes versioned SQL. Never use db push on the shared database.
const result = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  {
    cwd: project,
    env: { ...process.env, DIRECT_URL: directUrl },
    stdio: 'inherit',
  }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
