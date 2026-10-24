// Corre en `npm install` (prepare). Apunta git a .githooks para que el
// pre-push quede activo. No hace nada en CI, en Vercel ni fuera de un repo git.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

if (process.env.CI || process.env.VERCEL || !fs.existsSync('.git'))
  process.exit(0);

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'inherit',
});
if (result.status === 0) console.log('Git hooks activos (.githooks/pre-push).');
