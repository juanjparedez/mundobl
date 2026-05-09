// Auto-i18n: dado un archivo .tsx, lo reescribe usando useLocale().t()
// para todos los strings UI hardcoded, y mergea las claves nuevas a
// src/i18n/messages.ts (es y en blocks). Despues podes correr
// `npx tsx scripts/translate-locales.ts` para que los 8 idiomas IA
// se actualicen con las claves nuevas.
//
// Uso:
//   npx tsx scripts/auto-i18n-file.ts <path>             # dry-run (preview)
//   npx tsx scripts/auto-i18n-file.ts <path> --apply     # escribe cambios
//
// Workflow:
//   1. Lee el archivo
//   2. Lo manda a Gemini con instrucciones de migracion
//   3. Gemini devuelve { updatedFileContent, newKeys: { namespace, es: {...}, en: {...} } }
//   4. Si --apply: escribe el archivo + agrega claves al namespace en messages.ts
//   5. Tip al final: regenerar locales IA con `npx tsx scripts/translate-locales.ts`

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateText, GeminiError } from '../src/lib/gemini';

// Heuristica para detectar SERVER components — useLocale (que es un hook
// de cliente) NO funciona ahi. Si detecta un server component, abortamos
// con un mensaje claro para que el dev lo migre manualmente o usemos
// un helper server-side aparte.
function isServerComponent(content: string): { server: boolean; reason?: string } {
  if (/^['"]use client['"]/m.test(content)) return { server: false };
  if (/export\s+(?:async\s+)?function\s+generateMetadata/.test(content))
    return { server: true, reason: 'has generateMetadata (server-only)' };
  if (/export\s+default\s+async\s+function/.test(content))
    return { server: true, reason: 'has async default export (server component)' };
  if (/from\s+['"]next\/headers['"]/.test(content))
    return { server: true, reason: 'imports from next/headers (server-only)' };
  if (/import\s+\{[^}]*\bauth\b[^}]*\}\s+from\s+['"]@\/lib\/auth['"]/.test(content))
    return { server: true, reason: 'imports auth from @/lib/auth (server-side use)' };
  return { server: false };
}

// Valida que el output de Gemini sea sano:
// - newKeys.{key}.es y .en son strings (no undefined, no nested objects)
// - sin keys con caracteres invalidos
// - el file content no tiene patrones obviamente rotos
function validateMigration(result: MigrationResult): string | null {
  if (!result.namespace || !/^[a-z][a-zA-Z0-9]*$/.test(result.namespace)) {
    return `Invalid namespace: ${result.namespace}`;
  }
  for (const [key, value] of Object.entries(result.newKeys)) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) {
      return `Invalid key name "${key}"`;
    }
    if (
      !value ||
      typeof value !== 'object' ||
      typeof value.es !== 'string' ||
      typeof value.en !== 'string'
    ) {
      return `Key "${key}" has invalid value (need {es: string, en: string}). Got: ${JSON.stringify(value).slice(0, 100)}`;
    }
    if (value.es.length > 500 || value.en.length > 500) {
      return `Key "${key}" value too long (>500 chars)`;
    }
  }
  // Detect dynamic keys in t() calls (e.g. t(\`namespace.\${var}\`))
  if (/\bt\s*\(\s*[`]/.test(result.updatedFileContent)) {
    return 'File contains dynamic key in t() call (template literal in t())';
  }
  // Detect double-braced placeholders that don't match our single-brace format
  if (/\{\{\w+\}\}/.test(JSON.stringify(result.newKeys))) {
    return 'Translations use {{var}} (double braces) instead of {var} (single)';
  }
  return null;
}

// Run TypeScript type-check. Returns true if clean.
function typeCheckOk(): boolean {
  try {
    execSync('npx tsc --noEmit 2>&1', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

interface MigrationResult {
  updatedFileContent: string;
  namespace: string; // e.g. "myCases", "seriesContentManager"
  newKeys: Record<string, { es: string; en: string }>;
  notes?: string;
}

function buildPrompt(filePath: string, content: string): string {
  return `Sos un experto en i18n para React + TypeScript + Next.js + Ant Design.

Te voy a pasar un componente con strings UI hardcoded en español. Tenes que reescribirlo para usar i18n via el hook custom \`useLocale().t('key.path')\`.

REGLAS ESTRICTAS:
1. Reemplazar TODOS los strings UI hardcoded (placeholder=, label=, title=, message.success/error/warning, throw new Error con mensajes user-facing, description=, tooltip=, okText, cancelText, Form rule message, JSX text content visible al usuario).
2. NO traduzcas: nombres tecnicos (className, key, paths, URLs, identifiers JS), strings de debug/console.log que no son UI, comentarios.
3. Si el archivo no tiene 'use client', AGREGALO al inicio (los components con t() necesitan ser client).
4. Si no importa useLocale, AGREGALO: \`import { useLocale } from '@/lib/providers/LocaleProvider';\`.
5. Si el componente no tiene \`const { t } = useLocale();\`, AGREGALO como primera linea dentro de la funcion del componente.
6. Las keys siguen el formato \`{namespace}.{camelCaseKey}\`. Elegi UN namespace coherente para el archivo (ej. "seriesForm", "myCases", "verSerie"), basado en el nombre del archivo o su proposito.
7. Las keys deben ser descriptivas (ej. \`saveButton\`, \`deleteConfirmTitle\`) — no usar el texto traducido como key.
8. NO toques: imports existentes que no sean para i18n, logica del componente, tipado, estilos, JSX structure.
9. Si encontras un string que ya esta en t('...'), dejalo como esta.
10. Para placeholders dinamicos como "Mostrar {n} de {total}" → mantene los placeholders {n}, {total} en la traduccion.

OUTPUT — formato estricto con 4 separadores literal, en este orden exacto:

===NAMESPACE===
{namespace}
===KEYS===
{json valido SOLO con el mapping de keys}
===FILE===
{el codigo TSX entero migrado, exactamente como debe quedar el archivo, sin markdown fences}
===END===

Ejemplo del formato KEYS (json simple, NO incluye el archivo):
{"saveButton":{"es":"Guardar","en":"Save"},"deleteConfirm":{"es":"¿Eliminar?","en":"Delete?"}}

ARCHIVO: ${filePath}
CONTENIDO ORIGINAL:
\`\`\`tsx
${content}
\`\`\``;
}

function extractMigration(response: string): MigrationResult {
  const namespaceMatch = response.match(
    /===NAMESPACE===\s*\n([\s\S]*?)\n===KEYS===/
  );
  const keysMatch = response.match(/===KEYS===\s*\n([\s\S]*?)\n===FILE===/);
  const fileMatch = response.match(/===FILE===\s*\n([\s\S]*?)\n===END===/);

  if (!namespaceMatch || !keysMatch || !fileMatch) {
    throw new Error(
      `Missing separators in response. Got namespace=${!!namespaceMatch}, keys=${!!keysMatch}, file=${!!fileMatch}. Response head: ${response.slice(0, 300)}`
    );
  }

  const namespace = namespaceMatch[1].trim();
  let fileContent = fileMatch[1];
  // Strip markdown fences if Gemini wrapped the file content anyway
  fileContent = fileContent
    .replace(/^```(?:tsx?|jsx?|typescript|javascript)?\s*\n/m, '')
    .replace(/\n```\s*$/m, '');

  let newKeys: Record<string, { es: string; en: string }>;
  const rawKeys = keysMatch[1].trim();
  // Strip markdown fences from keys block too if present
  const cleanKeys = rawKeys
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
  try {
    newKeys = JSON.parse(cleanKeys);
  } catch (e) {
    throw new Error(
      `Failed to parse KEYS json: ${e instanceof Error ? e.message : e}. Keys block head: ${cleanKeys.slice(0, 300)}`
    );
  }

  return {
    namespace,
    newKeys,
    updatedFileContent: fileContent,
  };
}

async function migrateFile(filePath: string): Promise<MigrationResult> {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }
  const content = fs.readFileSync(absPath, 'utf8');
  const relPath = path.relative(process.cwd(), absPath);

  console.log(`Migrating ${relPath} (${content.length} chars)...`);
  const response = await generateText({
    prompt: buildPrompt(relPath, content),
    temperature: 0.1,
    maxOutputTokens: 16384,
    thinkingBudget: 0,
  });

  const result = extractMigration(response);
  if (!result.updatedFileContent || !result.namespace || !result.newKeys) {
    throw new Error(
      `Incomplete migration result. Got keys: ${Object.keys(result).join(', ')}`
    );
  }
  return result;
}

// Inserta el namespace y sus claves nuevas en src/i18n/messages.ts.
// Maneja 3 lugares: type definition + es block + en block.
// Si el namespace ya existe, mergea las claves nuevas (sin pisar existentes).
function mergeIntoMessages(
  namespace: string,
  newKeys: Record<string, { es: string; en: string }>
): { added: number; skipped: number } {
  const messagesPath = path.join(
    process.cwd(),
    'src',
    'i18n',
    'messages.ts'
  );
  const original = fs.readFileSync(messagesPath, 'utf8');

  // Find existing namespace blocks via simple regex (3 places: type, es, en).
  // Strategy:
  //   - Type: `${namespace}: {` ... `};` inside `export type TranslationShape = {`
  //   - es: same pattern but inside `const es: TranslationShape = {`
  //   - en: same pattern but inside `const en: TranslationShape = {`
  //
  // For simplicity, we look for occurrences of `  ${namespace}: {` (2-space indent
  // expected for top-level groups) and operate on each one in order.

  const namespaceLine = `  ${namespace}: {`;
  const occurrences: number[] = [];
  let idx = 0;
  while ((idx = original.indexOf(namespaceLine, idx)) !== -1) {
    occurrences.push(idx);
    idx += namespaceLine.length;
  }

  let added = 0;
  let skipped = 0;

  if (occurrences.length === 0) {
    // Namespace does not exist anywhere. Need to add it to type, es, en.
    const newType = Object.keys(newKeys)
      .map((k) => `    ${k}: string;`)
      .join('\n');
    const newEs = Object.entries(newKeys)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v.es)},`)
      .join('\n');
    const newEn = Object.entries(newKeys)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v.en)},`)
      .join('\n');

    // Insert new namespace BEFORE the closing `};` of each block.
    // For type: find `};` after `export type TranslationShape = {`
    // For es: find `};` after `const es: TranslationShape = {`
    // For en: find `};` after `const en: TranslationShape = {`
    const typeStart = original.indexOf('export type TranslationShape = {');
    const esStart = original.indexOf('const es: TranslationShape = {');
    const enStart = original.indexOf('const en: TranslationShape = {');

    if (typeStart === -1 || esStart === -1 || enStart === -1) {
      throw new Error(
        'Could not locate TranslationShape / es / en blocks in messages.ts'
      );
    }

    // Find the closing `};` of each (the FIRST `};` after each start that is at
    // column 0 — i.e. literally `\n};\n`).
    function findBlockEnd(startIdx: number): number {
      const closeMarker = '\n};\n';
      const closeIdx = original.indexOf(closeMarker, startIdx);
      if (closeIdx === -1) {
        throw new Error('Could not find block end after position ' + startIdx);
      }
      return closeIdx;
    }

    const typeEnd = findBlockEnd(typeStart);
    const esEnd = findBlockEnd(esStart);
    const enEnd = findBlockEnd(enStart);

    // Insert in reverse order to keep earlier indexes valid.
    const inserts = [
      { at: enEnd, text: `\n  ${namespace}: {\n${newEn}\n  },` },
      { at: esEnd, text: `\n  ${namespace}: {\n${newEs}\n  },` },
      { at: typeEnd, text: `\n  ${namespace}: {\n${newType}\n  };` },
    ].sort((a, b) => b.at - a.at);

    let updated = original;
    for (const ins of inserts) {
      updated = updated.slice(0, ins.at) + ins.text + updated.slice(ins.at);
    }
    fs.writeFileSync(messagesPath, updated);
    added = Object.keys(newKeys).length;
    return { added, skipped };
  }

  if (occurrences.length !== 3) {
    throw new Error(
      `Expected exactly 3 occurrences of "${namespaceLine}" (type/es/en), found ${occurrences.length}`
    );
  }

  // Namespace exists in 3 places. Merge keys into each.
  // For each occurrence, find the closing `};` or `},` (it's an inner block).
  // We treat the inner block as: from `${namespace}: {` to the matching `};` or `},`.

  function findInnerBlockEnd(startIdx: number): number {
    // Inner block ends with `\n  };` or `\n  },` for nested blocks (4-space inner).
    // We use brace-counting to be safe.
    let depth = 0;
    let i = original.indexOf('{', startIdx);
    if (i === -1) throw new Error('No opening brace found');
    depth = 1;
    i++;
    while (i < original.length && depth > 0) {
      if (original[i] === '{') depth++;
      else if (original[i] === '}') depth--;
      i++;
    }
    if (depth !== 0) throw new Error('Unbalanced braces');
    return i - 1; // position of closing `}`
  }

  const blocks = occurrences.map((startLineIdx) => {
    const open = original.indexOf('{', startLineIdx);
    const close = findInnerBlockEnd(startLineIdx);
    return { startLineIdx, open, close };
  });

  // blocks[0] = type, blocks[1] = es, blocks[2] = en (assuming order in file)

  // Find existing keys in each block to skip duplicates
  const existingTypeKeys = new Set<string>();
  const typeBlockBody = original.slice(blocks[0].open + 1, blocks[0].close);
  for (const m of typeBlockBody.matchAll(/^\s*(\w+)\s*:/gm)) {
    existingTypeKeys.add(m[1]);
  }

  const keysToAdd = Object.entries(newKeys).filter(([k]) => {
    if (existingTypeKeys.has(k)) {
      skipped++;
      return false;
    }
    added++;
    return true;
  });

  if (keysToAdd.length === 0) {
    return { added, skipped };
  }

  const newTypeLines = keysToAdd
    .map(([k]) => `    ${k}: string;`)
    .join('\n');
  const newEsLines = keysToAdd
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v.es)},`)
    .join('\n');
  const newEnLines = keysToAdd
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v.en)},`)
    .join('\n');

  // Insert before the closing `}` of each block. Reverse order.
  const inserts = [
    { at: blocks[2].close, text: `${newEnLines}\n  ` },
    { at: blocks[1].close, text: `${newEsLines}\n  ` },
    { at: blocks[0].close, text: `${newTypeLines}\n  ` },
  ].sort((a, b) => b.at - a.at);

  let updated = original;
  for (const ins of inserts) {
    updated = updated.slice(0, ins.at) + ins.text + updated.slice(ins.at);
  }
  fs.writeFileSync(messagesPath, updated);
  return { added, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Usage: npx tsx scripts/auto-i18n-file.ts <file> [--apply]');
    process.exit(1);
  }
  const filePath = args[0];
  const apply = args.includes('--apply');

  try {
    // Pre-flight: detectar server components
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      console.error(`File not found: ${absPath}`);
      process.exit(1);
    }
    const original = fs.readFileSync(absPath, 'utf8');
    const serverCheck = isServerComponent(original);
    if (serverCheck.server) {
      console.error(`SKIP: ${filePath} es server component (${serverCheck.reason}).`);
      console.error(
        `useLocale() es client-only. Migrar manualmente o crear un helper server-side.`
      );
      process.exit(2); // Exit code 2 = skipped, distinto a error real
    }

    const result = await migrateFile(filePath);

    // Validar output ANTES de tocar nada
    const validationError = validateMigration(result);
    if (validationError) {
      console.error(`Validation failed: ${validationError}`);
      process.exit(1);
    }

    console.log(`\n=== Migration result ===`);
    console.log(`Namespace: ${result.namespace}`);
    console.log(`New keys (${Object.keys(result.newKeys).length}):`);
    for (const [k, v] of Object.entries(result.newKeys)) {
      console.log(`  ${k}: "${v.es}" / "${v.en}"`);
    }

    if (!apply) {
      console.log('\n[DRY RUN] Use --apply to write changes.');
      const preview = path.join('/tmp', `i18n-preview-${path.basename(filePath)}`);
      fs.writeFileSync(preview, result.updatedFileContent);
      console.log(`Updated content preview written to: ${preview}`);
      return;
    }

    // Snapshot del estado antes de aplicar — para revert si falla type-check.
    const messagesPath = path.join(process.cwd(), 'src', 'i18n', 'messages.ts');
    const messagesBackup = fs.readFileSync(messagesPath, 'utf8');

    // Apply: write file + merge into messages.ts
    fs.writeFileSync(absPath, result.updatedFileContent);
    const merged = mergeIntoMessages(result.namespace, result.newKeys);
    console.log(
      `Wrote ${filePath} + merged ${merged.added} keys (${merged.skipped} skipped).`
    );

    // Type-check post-apply. Si falla, revert.
    process.stdout.write('Type-checking... ');
    if (!typeCheckOk()) {
      console.log('FAILED — reverting');
      fs.writeFileSync(absPath, original);
      fs.writeFileSync(messagesPath, messagesBackup);
      console.error(
        `Type-check failed after migration. ${filePath} and messages.ts reverted to pre-migration state.`
      );
      process.exit(3); // Exit code 3 = type-check failure (post-revert)
    }
    console.log('OK');
    console.log(
      `\nNext step: \`npx tsx scripts/translate-locales.ts\` to fill the 8 IA locales with the new keys.`
    );
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error(`Gemini error: ${err.message}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
