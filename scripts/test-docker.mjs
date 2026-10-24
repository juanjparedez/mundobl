import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configOnly = process.argv.includes('--config');
if (process.argv.slice(2).some((arg) => arg !== '--config')) {
  console.error('Uso: npm run test:docker [-- --config]');
  process.exit(1);
}
let command = 'docker';
let prefix = [];
const probe = (cmd, args) =>
  spawnSync(cmd, args, { encoding: 'utf8', cwd: root });
if (probe(command, ['compose', 'version']).status !== 0) {
  if (
    process.platform !== 'win32' ||
    probe('wsl.exe', ['--exec', 'docker', 'compose', 'version']).status !== 0
  ) {
    console.error(
      'Falta Docker Compose. Abrí Docker Desktop o instalá el plugin Compose en tu distribución WSL predeterminada.'
    );
    process.exit(1);
  }
  const converted = probe('wsl.exe', [
    '--exec',
    'wslpath',
    '-a',
    root.replaceAll('\\', '/'),
  ]);
  if (converted.status !== 0 || !converted.stdout.trim()) {
    console.error(
      converted.stderr ||
        converted.error?.message ||
        'No se pudo resolver el directorio en WSL.'
    );
    process.exit(1);
  }
  command = 'wsl.exe';
  prefix = ['--cd', converted.stdout.trim(), '--exec', 'docker'];
}
if (
  probe(command, [...prefix, 'info', '--format', '{{.ServerVersion}}'])
    .status !== 0
) {
  console.error(
    'Docker no está disponible. Iniciá el motor y volvé a intentar.'
  );
  process.exit(1);
}
const project = `mundobl-tests-${createHash('sha256').update(root).digest('hex').slice(0, 8)}`;
const compose = [
  ...prefix,
  'compose',
  '--project-name',
  project,
  '--env-file',
  'scripts/docker-test.env',
  '-f',
  'compose.test.yml',
];
if (configOnly) {
  process.exit(
    spawnSync(command, [...compose, 'config'], { cwd: root, stdio: 'inherit' })
      .status ?? 1
  );
}
const output = path.join(root, 'test-results', 'compose');
fs.mkdirSync(output, { recursive: true });
const lockPath = path.join(output, 'running.lock');
let lock;
try {
  lock = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(lock, String(process.pid));
} catch {
  console.error(
    `Ya hay una corrida o quedó su lock: ${lockPath}. Si fue interrumpida, comprobá que terminó antes de quitarlo.`
  );
  process.exit(1);
}
let child;
let interrupted = false;
const stop = () => {
  interrupted = true;
  child?.kill('SIGTERM');
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
let code = 1;
try {
  console.log(
    'Pruebas locales en contenedores. La ejecución no tiene salida a Internet; solo el build descarga dependencias.'
  );
  code = await new Promise((resolve) => {
    child = spawn(
      command,
      [
        ...compose,
        'up',
        '--build',
        '--abort-on-container-exit',
        '--exit-code-from',
        'tests',
      ],
      { cwd: root, stdio: 'inherit' }
    );
    child.on('error', (error) => {
      console.error(error.message);
      resolve(1);
    });
    child.on('exit', (result) => resolve(result ?? 1));
  });
} finally {
  const cleanup = spawnSync(command, [...compose, 'down', '--remove-orphans'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (cleanup.status !== 0) code = 1;
  fs.closeSync(lock);
  fs.unlinkSync(lockPath);
  process.off('SIGINT', stop);
  process.off('SIGTERM', stop);
}
process.exit(interrupted ? 130 : code);
