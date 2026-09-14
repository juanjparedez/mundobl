/* eslint-disable no-console */
/**
 * Auditoria de variables de entorno: que lee el codigo vs que documenta
 * `.env.example` vs que hay en el `.env` local.
 *
 * Solo trabaja con NOMBRES. Nunca imprime valores — la salida esta pensada para
 * poder pegarse en un issue o compartirse sin filtrar secretos.
 *
 * Uso: npx tsx scripts/audit-env.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

// Vars que node/npm/Windows inyectan solas o que vienen de dependencias:
// no son configuracion nuestra y ensucian el reporte.
const RUIDO = new Set([
  'NODE_ENV', 'DEBUG', 'NO_COLOR', 'COMPUTERNAME', '_CLUSTER_NETWORK_NAME_',
  'PRISMA_CLIENT_GET_TIME', 'PRISMA_DISABLE_WARNINGS',
  'TEST_CLIENT_ENGINE_REMOTE_EXECUTOR', 'BUILD_COMMIT_DATE',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.next', '.git', 'generated'].includes(e.name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|mjs|js)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/** Nombres declarados en un archivo .env (ignora comentarios y valores). */
function nombresDeEnv(file: string): Set<string> {
  if (!fs.existsSync(file)) return new Set();
  const out = new Set<string>();
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/);
    if (m) out.add(m[1]);
  }
  return out;
}

const archivos = [
  ...walk(path.join(ROOT, 'src')),
  ...walk(path.join(ROOT, 'scripts')).filter((f) => !f.endsWith('audit-env.ts')),
  path.join(ROOT, 'next.config.ts'),
].filter((f) => fs.existsSync(f));

// var -> { usos, tieneFallback }
const usadas = new Map<string, { usos: number; fallback: boolean }>();
for (const f of archivos) {
  const src = fs.readFileSync(f, 'utf-8');
  const re = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    if (RUIDO.has(name)) continue;
    // Tiene default si:
    //  a) usa `||` o `??` inmediatamente despues, o
    //  b) se pasa como primer argumento a un normalize*/parse* que recibe un
    //     segundo argumento con el default (patron de proxy.ts y runtime-freeze.ts).
    const after = src.slice(m.index + m[0].length, m.index + m[0].length + 6);
    const before = src.slice(Math.max(0, m.index - 60), m.index);
    const conOperador = /^\s*(\|\||\?\?)/.test(after);
    const esArgConDefault =
      /(normalize|parse|read|env)[A-Za-z]*\(\s*$/.test(before) &&
      /^\s*,/.test(src.slice(m.index + m[0].length).replace(/^[^,)]*/, ''));
    const tieneFallback = conOperador || esArgConDefault;
    const prev = usadas.get(name);
    usadas.set(name, {
      usos: (prev?.usos ?? 0) + 1,
      fallback: (prev?.fallback ?? false) || tieneFallback,
    });
  }
}

const ejemplo = nombresDeEnv(path.join(ROOT, '.env.example'));
const local = nombresDeEnv(path.join(ROOT, '.env'));
const localExtra = nombresDeEnv(path.join(ROOT, '.env.local'));
for (const n of localExtra) local.add(n);

const nombres = [...usadas.keys()].sort();

console.log('=== AUDITORIA DE ENV (solo nombres, nunca valores) ===\n');

const faltaEnEjemplo = nombres.filter((n) => !ejemplo.has(n));
console.log(`1) El codigo las lee pero .env.example NO las documenta: ${faltaEnEjemplo.length}`);
for (const n of faltaEnEjemplo) {
  const u = usadas.get(n)!;
  console.log(`   ${u.fallback ? '[opcional]' : '[SIN FALLBACK]'} ${n}  (${u.usos} usos)`);
}

const sobranEnEjemplo = [...ejemplo].filter((n) => !usadas.has(n)).sort();
console.log(`\n2) .env.example las documenta pero el codigo NO las lee: ${sobranEnEjemplo.length}`);
for (const n of sobranEnEjemplo) console.log(`   ${n}`);

const faltanLocal = nombres.filter((n) => !local.has(n) && !usadas.get(n)!.fallback);
console.log(`\n3) Sin fallback y ausentes de tu .env local: ${faltanLocal.length}`);
for (const n of faltanLocal) console.log(`   ${n}`);

console.log(`\n=== RESUMEN ===`);
console.log(`  variables que el codigo usa : ${nombres.length}`);
console.log(`  documentadas en .env.example: ${ejemplo.size}`);
console.log(`  presentes en .env local     : ${local.size}`);
console.log(`\n  .env.example esta ${faltaEnEjemplo.length === 0 ? 'COMPLETO' : 'DESACTUALIZADO'}`);
