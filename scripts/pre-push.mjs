// Hook pre-push: main no se publica en rojo.
//
// Git pasa por stdin una linea por ref: <local ref> <local sha> <remote ref> <remote sha>.
// Si alguna va a refs/heads/main, corre la verificacion completa sobre
// exactamente lo que se publica: el arbol tiene que estar limpio y HEAD tiene
// que ser el commit que se empuja. Para el resto de las ramas alcanza --fast,
// porque el PR igual pasa por CI.
//
// Saltear en una emergencia: git push --no-verify (queda bajo tu responsabilidad).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const ZERO = /^0+$/;
const lines = fs.readFileSync(0, 'utf8').split('\n').filter(Boolean);
const updates = lines
  .map((line) => line.split(' '))
  .filter(([, localSha]) => localSha && !ZERO.test(localSha));

if (updates.length === 0) process.exit(0);

const git = (...args) =>
  spawnSync('git', args, { encoding: 'utf8' }).stdout.trim();

const toMain = updates.find(
  ([, , remoteRef]) => remoteRef === 'refs/heads/main'
);

if (toMain) {
  const [, localSha] = toMain;
  const head = git('rev-parse', 'HEAD');
  if (head !== localSha) {
    console.error(
      `pre-push: se esta publicando ${localSha.slice(0, 7)} a main pero HEAD es ${head.slice(0, 7)}.\n` +
        'Hace checkout de lo que vas a publicar para poder probarlo.'
    );
    process.exit(1);
  }
  const dirty = git('status', '--porcelain', '--untracked-files=no');
  if (dirty) {
    console.error(
      'pre-push: hay cambios sin commitear. Las pruebas tienen que correr sobre lo que se publica.\n' +
        'Commitealos o guardalos (git stash) y volve a hacer push.\n' +
        dirty
    );
    process.exit(1);
  }
  console.log('pre-push: push a main, corriendo npm run test:all completo.');
}

const result = spawnSync(
  process.execPath,
  ['scripts/test-all.mjs', ...(toMain ? [] : ['--fast'])],
  { stdio: 'inherit' }
);
process.exit(result.status ?? 1);
