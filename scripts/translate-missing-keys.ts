/* eslint-disable no-console */
// Traduce SOLO las keys faltantes en un locale (delta) y mergea con
// las traducciones existentes. Mucho mas barato y menos propenso a
// flakiness que regenerar todo el locale.
//
// Source de verdad: bloque `en` de src/i18n/messages.ts
// Para cada locale target, calcula que paths faltan vs en, los
// traduce via Gemini, y reescribe el archivo respetando el orden
// de `en` (asi el diff queda limpio).
//
// Uso:
//   npx tsx scripts/translate-missing-keys.ts            # todos los pendientes
//   npx tsx scripts/translate-missing-keys.ts de         # uno solo
//
// Diferencia con translate-locales.ts: aquel reescribe todo el locale
// desde cero. Este mantiene las traducciones que ya existen y solo
// pide a Gemini las nuevas.

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import * as fs from 'fs';
import * as path from 'path';
import { generateText, GeminiError } from '../src/lib/gemini';
import { MESSAGES } from '../src/i18n/messages';

const TARGETS: { code: string; name: string; varName: string }[] = [
  { code: 'de', name: 'German (Deutsch)', varName: 'de' },
  { code: 'zh-CN', name: 'Simplified Chinese (简体中文)', varName: 'zhCN' },
  { code: 'zh-TW', name: 'Traditional Chinese (繁體中文)', varName: 'zhTW' },
  { code: 'th', name: 'Thai (ไทย)', varName: 'th' },
];

const BATCH_SIZE = 20;
const THROTTLE_MS = 4500;

// Log persistente: append a scripts/translate-missing-keys.log con
// timestamp por linea. Mirror a stdout. Asi si el script falla flaky
// (ej. Gemini devuelve array N-1 tras 3 retries) queda traza para
// debug. Tail -f desde otra terminal para ver progreso en vivo.
const LOG_PATH = path.join(
  process.cwd(),
  'scripts',
  'translate-missing-keys.log'
);

function ts(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function log(msg: string): void {
  const line = `[${ts()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

function logRaw(msg: string): void {
  // Para logs sin timestamp (separadores, headers, traza de error)
  console.log(msg);
  fs.appendFileSync(LOG_PATH, msg + '\n');
}

const stats = {
  batchesOk: 0,
  retries: 0,
  errors: 0,
  startedAt: Date.now(),
};

interface FlatEntry {
  pathKeys: string[];
  value: string;
}

function flatten(
  obj: unknown,
  basePath: string[] = [],
  out: FlatEntry[] = []
): FlatEntry[] {
  if (!obj || typeof obj !== 'object') return out;
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof val === 'string') {
      out.push({ pathKeys: [...basePath, key], value: val });
    } else if (val && typeof val === 'object') {
      flatten(val, [...basePath, key], out);
    }
  }
  return out;
}

function getLeaf(obj: unknown, pathKeys: string[]): string | undefined {
  let cur: unknown = obj;
  for (const k of pathKeys) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function setLeaf(
  obj: Record<string, unknown>,
  pathKeys: string[],
  value: string
): void {
  let cur = obj;
  for (let i = 0; i < pathKeys.length - 1; i++) {
    const seg = pathKeys[i];
    if (typeof cur[seg] !== 'object' || cur[seg] === null) cur[seg] = {};
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[pathKeys[pathKeys.length - 1]] = value;
}

function extractJsonArray(response: string): string[] {
  const fenced = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const candidate = fenced ? fenced[1] : response;
  const arrMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrMatch) {
    throw new Error(`No JSON array found in response: ${response.slice(0, 300)}`);
  }
  return JSON.parse(arrMatch[0]);
}

async function translateBatch(
  strings: string[],
  target: { code: string; name: string }
): Promise<string[]> {
  const numbered = strings
    .map((s, i) => `${i}: ${JSON.stringify(s)}`)
    .join('\n');

  const prompt = `Translate the following ${strings.length} UI strings from English to ${target.name} for a website about Asian BL/GL TV series.

CRITICAL RULES:
- Preserve placeholders like {count}, {title}, {name}, {n}, {date}, %s EXACTLY.
- Do NOT translate brand names: MundoBL, BL, GL, OST, BSO. Keep them as-is.
- Keep tone friendly and concise (UI labels, often 1-5 words).
- Do not add quotation marks around translations.
- Output ONLY a JSON array of ${strings.length} translated strings, in the same order.

Input strings (numbered for reference, but output without numbers):
${numbered}

Output (JSON array of exactly ${strings.length} translated strings):`;

  const response = await generateText({
    prompt,
    temperature: 0.2,
    maxOutputTokens: 8192,
    thinkingBudget: 0,
  });

  const parsed = extractJsonArray(response);
  if (!Array.isArray(parsed) || parsed.length !== strings.length) {
    throw new Error(
      `Expected array of ${strings.length}, got ${
        Array.isArray(parsed) ? parsed.length : 'non-array'
      }. Response head: ${response.slice(0, 200)}`
    );
  }
  return parsed.map((s) => String(s));
}

function serializeAsTs(varName: string, obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj, null, 2);
  return `// Auto-generated by scripts/translate-locales.ts
// Source: src/i18n/messages.ts (English block)
// To regenerate: \`npx tsx scripts/translate-locales.ts ${varName}\`
//
// Si encontras un error o frase que sonara mejor en este idioma,
// editar este archivo directamente. La proxima regeneracion no
// machaca cambios manuales si quitas este archivo de TARGETS o
// directamente lo dejas como esta.

import type { TranslationShape } from '../messages';

const ${varName}: TranslationShape = ${json} as TranslationShape;

export default ${varName};
`;
}

async function loadCurrentLocale(code: string): Promise<unknown> {
  const filePath = path.join(
    process.cwd(),
    'src',
    'i18n',
    'locales',
    `${code}.ts`
  );
  // tsx soporta esto a traves de import dinamico
  const mod = await import(filePath);
  return mod.default;
}

async function processLocale(target: {
  code: string;
  name: string;
  varName: string;
}): Promise<void> {
  logRaw('');
  log(`=== ${target.name} (${target.code}) ===`);

  const enFlat = flatten(MESSAGES.en);
  const current = await loadCurrentLocale(target.code);
  const currentFlat = flatten(current);
  const currentKeys = new Set(currentFlat.map((e) => e.pathKeys.join('.')));

  const missing = enFlat.filter((e) => !currentKeys.has(e.pathKeys.join('.')));
  log(
    `  ${target.code}: source=${enFlat.length} current=${currentFlat.length} missing=${missing.length}`
  );

  if (missing.length === 0) {
    log(`  ${target.code}: nothing to do, skipping`);
    return;
  }

  const translatedMap = new Map<string, string>();
  const totalBatches = Math.ceil(missing.length / BATCH_SIZE);

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = missing.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((b) => b.value);
    log(
      `  ${target.code} batch ${batchNum}/${totalBatches} (${batch.length} strings)...`
    );

    let outputs: string[] | null = null;
    let attempts = 0;
    while (!outputs && attempts < 3) {
      attempts++;
      try {
        outputs = await translateBatch(inputs, target);
      } catch (err) {
        const msg = err instanceof GeminiError ? err.message : String(err);
        stats.retries++;
        log(
          `  ${target.code} batch ${batchNum} attempt ${attempts} failed: ${msg.slice(0, 120)}`
        );
        if (attempts >= 3) {
          stats.errors++;
          logRaw(err instanceof Error ? (err.stack ?? err.message) : String(err));
          throw err;
        }
        await new Promise((r) => setTimeout(r, 2000 * attempts));
      }
    }
    if (!outputs) throw new Error('No outputs after retries');

    for (let j = 0; j < batch.length; j++) {
      translatedMap.set(batch[j].pathKeys.join('.'), outputs[j]);
    }
    stats.batchesOk++;
    log(`  ${target.code} batch ${batchNum} OK`);

    if (i + BATCH_SIZE < missing.length) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  // Build merged object that follows the order of en (for stable diffs):
  // for each leaf in en, take the existing translation if present,
  // otherwise take the freshly translated value.
  const merged: Record<string, unknown> = {};
  for (const e of enFlat) {
    const key = e.pathKeys.join('.');
    const existing = getLeaf(current, e.pathKeys);
    const fresh = translatedMap.get(key);
    const value = existing ?? fresh;
    if (value === undefined) {
      throw new Error(`Missing value for ${key} after merge — should not happen`);
    }
    setLeaf(merged, e.pathKeys, value);
  }

  const filePath = path.join(
    process.cwd(),
    'src',
    'i18n',
    'locales',
    `${target.code}.ts`
  );
  fs.writeFileSync(filePath, serializeAsTs(target.varName, merged));
  log(`  ${target.code}: wrote ${filePath} (${enFlat.length} keys total)`);
}

async function main() {
  const arg = process.argv[2];
  const targets = arg
    ? TARGETS.filter((t) => t.code === arg || t.varName === arg)
    : TARGETS;

  if (arg && targets.length === 0) {
    console.error(
      `Unknown locale "${arg}". Valid: ${TARGETS.map((t) => t.code).join(', ')}`
    );
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY no esta seteado. Agregalo al .env.');
    process.exit(1);
  }

  logRaw('');
  logRaw(`========================================================`);
  log(`run started — ${new Date().toISOString()}`);
  log(
    `processing ${targets.length} locale(s): ${targets.map((t) => t.code).join(', ')}`
  );

  for (const target of targets) {
    await processLocale(target);
  }

  const elapsedSec = Math.round((Date.now() - stats.startedAt) / 1000);
  logRaw('');
  log(
    `run completed in ${elapsedSec}s — batchesOk=${stats.batchesOk} retries=${stats.retries} errors=${stats.errors}`
  );
  logRaw(`========================================================`);
}

main().catch((err) => {
  log(`run aborted: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stack) logRaw(err.stack);
  logRaw(`========================================================`);
  console.error(err);
  process.exit(1);
});
