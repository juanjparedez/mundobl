// Auditoria automatica de strings hardcoded en componentes.
// Detecta los patrones mas comunes que NO usan useLocale().t():
//   - placeholder="..."
//   - title="..." en componentes antd (Modal, Drawer, Card, Tooltip, Popconfirm)
//   - message.success/error/warning/info('...')
//   - notification.* ('...')
//   - rules de Form: { required, message: '...' }
//   - throw new Error('...')
//   - JSX text content directo: >Texto<
//   - Tags / labels visibles
//
// Output: tabla agrupada por archivo, con line numbers y string detectado.

import * as fs from 'fs';
import * as path from 'path';

interface Finding {
  file: string;
  line: number;
  pattern: string;
  text: string;
}

const SRC_DIR = path.join(process.cwd(), 'src');
const findings: Finding[] = [];

// Heuristica: el string parece "user facing" (en español o ingles, no debug)
// si tiene letras en vez de solo simbolos/codigo, longitud razonable, no es URL,
// no es un className.
function looksUserFacing(text: string): boolean {
  if (text.length < 2 || text.length > 200) return false;
  if (/^[a-z][a-zA-Z0-9_-]*$/.test(text)) return false; // identifier-like (className, key)
  if (/^[a-z]+(-[a-z]+)+$/.test(text)) return false; // kebab-case (className)
  if (/^https?:\/\//.test(text)) return false; // URL
  if (/^[A-Z_]+$/.test(text)) return false; // CONSTANT_LIKE
  if (/^[\d.,/-]+$/.test(text)) return false; // numbers/dates
  if (/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(text)) return false; // file.ext
  if (/^[/.][\w/-]+$/.test(text)) return false; // /path/like
  // Tiene que tener al menos una letra y al menos un caracter alfabetico mayus o
  // espacio (cuando es frase). Esto descarta cosas como "px", "rem", "auto".
  if (!/[a-zA-Z]/.test(text)) return false;
  return true;
}

const PATTERNS: Array<{
  name: string;
  // Group 1 = the user-facing text inside quotes
  regex: RegExp;
}> = [
  { name: 'placeholder=', regex: /\bplaceholder\s*=\s*["']([^"']+)["']/g },
  // antd Modal/Drawer/Card title
  { name: 'title=', regex: /\btitle\s*=\s*["']([^"']+)["']/g },
  // message.success/error/warning/info('...')
  { name: 'message.*()', regex: /\bmessage\.(?:success|error|warning|info)\s*\(\s*["']([^"']+)["']/g },
  // notification.*('...')
  { name: 'notification.*()', regex: /\bnotification\.(?:success|error|warning|info)\s*\(\s*\{\s*[^}]*?(?:message|description)\s*:\s*["']([^"']+)["']/g },
  // throw new Error('...')
  { name: 'throw Error', regex: /\bthrow\s+new\s+Error\s*\(\s*["']([^"']+)["']/g },
  // antd Form rule message: '...'
  { name: 'Form rule message', regex: /\bmessage\s*:\s*["']([A-ZÁÉÍÓÚÑ][^"']{2,})["']/g },
  // Tag / Tooltip text content - <Tag>Texto</Tag> or <Tooltip title="Texto">
  { name: 'Tooltip title=', regex: /<Tooltip\s+[^>]*title\s*=\s*["']([^"']+)["']/g },
  // confirm() / alert() texts - rare but exist
  { name: 'confirm()', regex: /\bconfirm\s*\(\s*["']([^"']+)["']/g },
  // okText/cancelText/closeText/etc on antd
  { name: 'okText=', regex: /\bokText\s*=\s*["']([^"']+)["']/g },
  { name: 'cancelText=', regex: /\bcancelText\s*=\s*["']([^"']+)["']/g },
  // Popconfirm title
  { name: 'Popconfirm title', regex: /<Popconfirm[^>]*\stitle\s*=\s*["']([^"']+)["']/g },
  // label= en Form.Item / Checkbox / Radio
  { name: 'label=', regex: /\blabel\s*=\s*["']([^"']+)["']/g },
  // description= en Empty / Result / etc
  { name: 'description=', regex: /\bdescription\s*=\s*["']([^"']+)["']/g },
  // tooltip= en antd
  { name: 'tooltip=', regex: /\btooltip\s*=\s*["']([^"']+)["']/g },
];

function scanFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(process.cwd(), filePath);
  const lines = content.split('\n');

  for (const pattern of PATTERNS) {
    pattern.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.regex.exec(content)) !== null) {
      const text = m[1];
      if (!looksUserFacing(text)) continue;

      // Calculate line number
      const before = content.slice(0, m.index);
      const line = before.split('\n').length;

      // Skip if the line is commented out
      const lineContent = lines[line - 1] || '';
      if (/^\s*\/\//.test(lineContent)) continue;

      // Skip if it looks like t(...) call result
      const surrounding = content.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20);
      if (/t\(['"][^'"]+['"]\)/.test(surrounding)) {
        // It's likely already a t() call: skip
        continue;
      }

      findings.push({
        file: relPath,
        line,
        pattern: pattern.name,
        text,
      });
    }
  }
}

function walk(dir: string): void {
  if (dir.includes('generated') || dir.includes('node_modules')) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && /\.tsx$/.test(entry.name)) {
      scanFile(full);
    }
  }
}

walk(SRC_DIR);

// Group by file
const byFile = new Map<string, Finding[]>();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file)!.push(f);
}

// Group by directory for high-level view
const byDir = new Map<string, number>();
for (const [file, items] of byFile) {
  const dir = file.replace(/\/[^/]+$/, '');
  byDir.set(dir, (byDir.get(dir) || 0) + items.length);
}

console.log('=== Hardcoded strings audit ===\n');
console.log(`Total findings: ${findings.length}`);
console.log(`Files affected: ${byFile.size}\n`);

console.log('=== By directory (top 20) ===');
const sortedDirs = [...byDir.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [dir, count] of sortedDirs) {
  console.log(`  ${count.toString().padStart(4)} | ${dir}`);
}

console.log('\n=== By pattern ===');
const byPattern = new Map<string, number>();
for (const f of findings) {
  byPattern.set(f.pattern, (byPattern.get(f.pattern) || 0) + 1);
}
const sortedPatterns = [...byPattern.entries()].sort((a, b) => b[1] - a[1]);
for (const [pattern, count] of sortedPatterns) {
  console.log(`  ${count.toString().padStart(4)} | ${pattern}`);
}

console.log('\n=== Files with most findings (top 30) ===');
const sortedFiles = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 30);
for (const [file, items] of sortedFiles) {
  console.log(`  ${items.length.toString().padStart(3)} | ${file}`);
}

// Write detailed JSON for fix-up tooling
const outPath = '/tmp/i18n-audit.json';
fs.writeFileSync(outPath, JSON.stringify({ findings, byFile: Object.fromEntries(byFile), byPattern: Object.fromEntries(byPattern) }, null, 2));
console.log(`\nDetailed report: ${outPath}`);
