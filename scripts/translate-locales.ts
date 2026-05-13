/* eslint-disable no-console */
// Carga env files con la MISMA logica que `next dev` (.env, .env.local,
// .env.development, .env.development.local) en vez de solo `.env` que
// daria `dotenv/config`. Esto matchea como funciona la app cuando corre
// localmente, sin sorpresas de "anda en dev pero no en este script".
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import * as fs from 'fs';
import * as path from 'path';
import { generateText, GeminiError } from '../src/lib/gemini';
import { MESSAGES } from '../src/i18n/messages';

// Genera traducciones reales (no aliases) para los 8 locales que antes
// eran solo `{ ...en, common: { language: 'XXX' } }`. El source de
// verdad es el bloque `en` de messages.ts.
//
// Uso:
//   npx tsx scripts/translate-locales.ts            # todos
//   npx tsx scripts/translate-locales.ts it         # uno solo (debug)
//
// Estrategia:
//   - Aplanar el TranslationShape de en en una lista de leaves
//   - Batchear de a ~40 strings por call a Gemini
//   - Throttle 4.5s entre calls (free tier: 15 RPM)
//   - Reconstruir el shape anidado y escribir src/i18n/locales/{code}.ts

const TARGETS: { code: string; name: string; varName: string }[] = [
  { code: 'it', name: 'Italian (Italiano)', varName: 'it' },
  { code: 'de', name: 'German (Deutsch)', varName: 'de' },
  { code: 'fr', name: 'French (Français)', varName: 'fr' },
  { code: 'ja', name: 'Japanese (日本語)', varName: 'ja' },
  { code: 'ko', name: 'Korean (한국어)', varName: 'ko' },
  { code: 'zh-CN', name: 'Simplified Chinese (简体中文)', varName: 'zhCN' },
  { code: 'zh-TW', name: 'Traditional Chinese (繁體中文)', varName: 'zhTW' },
  { code: 'th', name: 'Thai (ไทย)', varName: 'th' },
];

// BATCH_SIZE 20 (antes 40): Gemini fallaba flaky devolviendo array N-1
// con batches grandes, especialmente para japones y koreano. 20 strings
// por batch reduce drasticamente la frecuencia de retries. Alineado con
// scripts/translate-missing-keys.ts.
const BATCH_SIZE = 20;
const THROTTLE_MS = 4500; // 15 RPM free tier

interface FlatEntry {
  path: string[];
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
      out.push({ path: [...basePath, key], value: val });
    } else if (val && typeof val === 'object') {
      flatten(val, [...basePath, key], out);
    }
  }
  return out;
}

function unflatten(entries: FlatEntry[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const e of entries) {
    let cur: Record<string, unknown> = result;
    for (let i = 0; i < e.path.length - 1; i++) {
      const seg = e.path[i];
      if (typeof cur[seg] !== 'object' || cur[seg] === null) {
        cur[seg] = {};
      }
      cur = cur[seg] as Record<string, unknown>;
    }
    cur[e.path[e.path.length - 1]] = e.value;
  }
  return result;
}

function extractJsonArray(response: string): string[] {
  // Gemini sometimes wraps in ```json ... ``` or adds prose. Be robust.
  const fenced = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const candidate = fenced ? fenced[1] : response;
  const arrMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrMatch) {
    throw new Error(
      `No JSON array found in response: ${response.slice(0, 300)}`
    );
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

function escapeForTemplate(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function serializeAsTs(varName: string, obj: Record<string, unknown>): string {
  // Pretty-print as a TS const literal. Use double-quoted strings via JSON
  // for safety (handles unicode, escapes, etc.).
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

const ${escapeForTemplate(varName)}: TranslationShape = ${json} as unknown as TranslationShape;

export default ${escapeForTemplate(varName)};
`;
}

async function translateLocale(target: {
  code: string;
  name: string;
  varName: string;
}): Promise<void> {
  console.log(`\n=== ${target.name} (${target.code}) ===`);
  const enSource = MESSAGES.en;
  const flat = flatten(enSource);
  console.log(`  Total strings: ${flat.length}`);

  const translated: FlatEntry[] = [];
  const totalBatches = Math.ceil(flat.length / BATCH_SIZE);

  for (let i = 0; i < flat.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = flat.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((b) => b.value);
    process.stdout.write(
      `  batch ${batchNum}/${totalBatches} (${batch.length} strings)... `
    );

    let outputs: string[] | null = null;
    let attempts = 0;
    while (!outputs && attempts < 3) {
      attempts++;
      try {
        outputs = await translateBatch(inputs, target);
      } catch (err) {
        const msg = err instanceof GeminiError ? err.message : String(err);
        console.log(`retry ${attempts} (${msg.slice(0, 80)})`);
        if (attempts >= 3) throw err;
        await new Promise((r) => setTimeout(r, 2000 * attempts));
      }
    }
    if (!outputs) throw new Error('No outputs after retries');

    for (let j = 0; j < batch.length; j++) {
      translated.push({ path: batch[j].path, value: outputs[j] });
    }
    console.log('OK');

    if (i + BATCH_SIZE < flat.length) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  const unflattened = unflatten(translated);
  const filePath = path.join(
    process.cwd(),
    'src',
    'i18n',
    'locales',
    `${target.code}.ts`
  );
  fs.writeFileSync(filePath, serializeAsTs(target.varName, unflattened));
  console.log(`  Wrote ${filePath}`);
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

  console.log(
    `Translating to ${targets.length} locale(s): ${targets.map((t) => t.code).join(', ')}`
  );
  for (const target of targets) {
    await translateLocale(target);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
