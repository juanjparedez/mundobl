/* eslint-disable no-console */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type FeatureRequestStatus,
  type FeatureRequestPriority,
} from '../src/generated/prisma';

/**
 * Triage del backlog 2026-05-13.
 *
 * - Lee FeatureRequest con status OPEN y aplica heuristica para inferir
 *   { category, effort, impact } a partir del title+description.
 * - Persistencia: prefijo en description tipo
 *     [cat:noticias][effort:S][impact:M] Texto original...
 *   (sin migracion; idempotente; reversible).
 * - Reporte: docs/backlog-triage-2026-05-13.md con ranking de quick-wins.
 *
 * Uso:
 *   npx tsx scripts/triage-backlog-2026-05-13.ts             # dry-run (default)
 *   npx tsx scripts/triage-backlog-2026-05-13.ts --apply     # escribe prefijos a DB
 *   npx tsx scripts/triage-backlog-2026-05-13.ts --report    # genera markdown
 *   npx tsx scripts/triage-backlog-2026-05-13.ts --apply --report
 */

const APPLY = process.argv.includes('--apply');
const REPORT = process.argv.includes('--report');
const REPORT_PATH = 'docs/backlog-triage-2026-05-13.md';

type Category =
  | 'noticias'
  | 'directores'
  | 'ai'
  | 'catalogo'
  | 'perfil'
  | 'admin'
  | 'i18n'
  | 'seo'
  | 'cleanup'
  | 'infra';

type Effort = 'S' | 'M' | 'L' | 'XL';
type Impact = 'L' | 'M' | 'H';

interface Heuristic {
  category: Category;
  effort: Effort;
  impact: Impact;
}

interface BacklogItem {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  createdAt: Date;
}

interface ParsedPrefix {
  category: Category | null;
  effort: Effort | null;
  impact: Impact | null;
  rawDescription: string;
}

const CATEGORY_KEYWORDS: Array<{ cat: Category; keywords: RegExp }> = [
  { cat: 'noticias', keywords: /\b(noticia|news|markdown|editor.*not|news ?top|top.*noticias)\b/i },
  { cat: 'directores', keywords: /\b(director|cineasta|filmografia|filmography)\b/i },
  { cat: 'ai', keywords: /\b(gemini|ia|\bai\b|asistente.*ia|recomend|recommend|llm|prompt)\b/i },
  { cat: 'catalogo', keywords: /\b(catalogo|catalog|busqueda|search|filtro|filter|tag|genero|genre|export|import)\b/i },
  { cat: 'perfil', keywords: /\b(perfil|profile|dashboard|widget|favorit|achievement|notificaci|push|review|comentario)\b/i },
  { cat: 'admin', keywords: /\b(admin|moderaci|moderation|panel|backoffice|aprob|approve)\b/i },
  { cat: 'i18n', keywords: /\b(i18n|locale|translate|traducc|idioma|messages\.ts|t\(|tServer)\b/i },
  { cat: 'seo', keywords: /\b(seo|sitemap|robots|schema\.org|jsonld|json-ld|breadcrumb|open ?graph|llms\.txt)\b/i },
  { cat: 'cleanup', keywords: /\b(limpiar|cleanup|refactor|huerfano|orphan|imports? no usado|warning|deprecated)\b/i },
  { cat: 'infra', keywords: /\b(oauth|cron|cache|deploy|infra|cloudflare|postgres|docker|build|ci\/cd|migration)\b/i },
];

const EFFORT_L_KEYWORDS = /\b(rediseno|rediseño|redisen|refactor.*completo|migracion masiva|migration.*all|fase 2|fase 3|scrap|scraping|nuevo modelo|new model|sistema)\b/i;
const EFFORT_XL_KEYWORDS = /\b(rediseno completo|reescribir|full rewrite|rearquitectura|migrar a otro)\b/i;
const IMPACT_H_KEYWORDS = /\b(todos los usuarios|publico|public|crash|critical|critico|seguridad|security|broken|bloquea)\b/i;
const IMPACT_L_KEYWORDS = /\b(nicho|admin.only|solo admin|interno|edge case|minor)\b/i;

const PREFIX_REGEX = /^(\[cat:[a-z-]+\])?\s*(\[effort:(S|M|L|XL)\])?\s*(\[impact:(L|M|H)\])?\s*/;

function parsePrefix(description: string | null): ParsedPrefix {
  const desc = description ?? '';
  const match = desc.match(PREFIX_REGEX);
  if (!match || (!match[1] && !match[2] && !match[4])) {
    return { category: null, effort: null, impact: null, rawDescription: desc };
  }
  const categoryMatch = match[1]?.match(/\[cat:([a-z-]+)\]/);
  const effortMatch = match[3] as Effort | undefined;
  const impactMatch = match[5] as Impact | undefined;
  return {
    category: (categoryMatch?.[1] as Category) ?? null,
    effort: effortMatch ?? null,
    impact: impactMatch ?? null,
    rawDescription: desc.slice(match[0].length),
  };
}

function inferHeuristic(item: BacklogItem): Heuristic {
  const haystack = `${item.title} ${item.description}`.toLowerCase();

  // Category: primer match en orden
  let category: Category = 'cleanup';
  for (const { cat, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.test(haystack)) {
      category = cat;
      break;
    }
  }

  // Effort: longitud + keywords
  let effort: Effort = 'M';
  const descLen = (item.description ?? '').length;
  if (EFFORT_XL_KEYWORDS.test(haystack)) effort = 'XL';
  else if (EFFORT_L_KEYWORDS.test(haystack) || descLen > 700) effort = 'L';
  else if (descLen < 200 && !/migrac|schema|endpoint/i.test(haystack)) effort = 'S';

  // Impact: priority es señal fuerte, mas keywords
  let impact: Impact = 'M';
  if (item.priority === 'CRITICAL' || item.priority === 'HIGH' || IMPACT_H_KEYWORDS.test(haystack))
    impact = 'H';
  else if (item.priority === 'LOW' || IMPACT_L_KEYWORDS.test(haystack)) impact = 'L';

  return { category, effort, impact };
}

function isQuickWin(h: Heuristic): boolean {
  // (S∧H) ∨ (S∧M) ∨ (M∧H)
  if (h.effort === 'S' && (h.impact === 'H' || h.impact === 'M')) return true;
  if (h.effort === 'M' && h.impact === 'H') return true;
  return false;
}

function buildPrefix(h: Heuristic): string {
  return `[cat:${h.category}][effort:${h.effort}][impact:${h.impact}]`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`=== Triage backlog 2026-05-13 ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ${REPORT ? '+REPORT' : ''} ===\n`);

  const items = (await prisma.featureRequest.findMany({
    where: { status: 'OPEN' },
    orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      priority: true,
      status: true,
      createdAt: true,
    },
  })) as BacklogItem[];

  console.log(`Items OPEN: ${items.length}\n`);

  interface Enriched {
    item: BacklogItem;
    parsed: ParsedPrefix;
    inferred: Heuristic;
    final: Heuristic;
    isQuickWin: boolean;
  }

  const enriched: Enriched[] = items.map((item) => {
    const parsed = parsePrefix(item.description);
    const inferred = inferHeuristic(item);
    const final: Heuristic = {
      category: parsed.category ?? inferred.category,
      effort: parsed.effort ?? inferred.effort,
      impact: parsed.impact ?? inferred.impact,
    };
    return { item, parsed, inferred, final, isQuickWin: isQuickWin(final) };
  });

  // Tabla agrupada por categoria
  const byCategory = new Map<Category, Enriched[]>();
  for (const e of enriched) {
    const arr = byCategory.get(e.final.category) ?? [];
    arr.push(e);
    byCategory.set(e.final.category, arr);
  }

  for (const [cat, list] of byCategory.entries()) {
    console.log(`\n[${cat}] (${list.length} items)`);
    for (const e of list) {
      const flags = `${e.final.effort}/${e.final.impact}${e.isQuickWin ? ' ⚡' : ''}`;
      const hasPrefix = e.parsed.category !== null;
      const titleShort = e.item.title.slice(0, 60).padEnd(60);
      console.log(
        `  #${String(e.item.id).padStart(3)} ${flags.padEnd(8)} ${hasPrefix ? '✓prefix' : '       '} ${titleShort}`
      );
    }
  }

  const quickWins = enriched.filter((e) => e.isQuickWin);
  console.log(`\n--- Quick wins: ${quickWins.length} / ${enriched.length} ---`);

  // Apply: escribir prefijos en description si no existen
  if (APPLY) {
    let updated = 0;
    let skipped = 0;
    for (const e of enriched) {
      const prefix = buildPrefix(e.final);
      const currentDescription = e.item.description ?? '';
      const alreadyPrefixed = e.parsed.category !== null;
      if (alreadyPrefixed) {
        skipped++;
        continue;
      }
      const newDescription = `${prefix} ${currentDescription}`.trim();
      await prisma.featureRequest.update({
        where: { id: e.item.id },
        data: { description: newDescription },
      });
      updated++;
    }
    console.log(`\nApply: ${updated} prefijos escritos, ${skipped} ya tenian prefijo.`);
  }

  // Report
  if (REPORT) {
    const md = renderReport(enriched, byCategory);
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, md, 'utf8');
    console.log(`\nReport escrito: ${REPORT_PATH}`);
  }
}

function renderReport(
  enriched: Array<{
    item: BacklogItem;
    final: Heuristic;
    isQuickWin: boolean;
  }>,
  byCategory: Map<Category, Array<{ item: BacklogItem; final: Heuristic; isQuickWin: boolean }>>
): string {
  const lines: string[] = [];
  const today = '2026-05-13';

  lines.push(`# Backlog triage — ${today}`);
  lines.push('');
  lines.push(
    `Generado por \`scripts/triage-backlog-2026-05-13.ts\`. Total OPEN: **${enriched.length}**.`
  );
  lines.push('');
  lines.push('## Convenciones');
  lines.push('');
  lines.push('- **Categoria** (10): noticias, directores, ai, catalogo, perfil, admin, i18n, seo, cleanup, infra.');
  lines.push('- **Effort**: S ≤2h, M ≤6h, L 1-2 dias, XL ≥3 dias.');
  lines.push('- **Impact**: H (visible a todos/desbloquea otros), M (mejora UX existente), L (nicho/admin-only).');
  lines.push('- **Quick win** = `(S∧H) ∨ (S∧M) ∨ (M∧H)`.');
  lines.push('- Persistencia: prefijo `[cat:X][effort:Y][impact:Z]` al inicio de `description` (sin migracion).');
  lines.push('');

  const quickWins = enriched
    .filter((e) => e.isQuickWin)
    .sort((a, b) => {
      // ordenar quick wins: S+H > S+M > M+H, luego por priority desc, luego por id asc
      const score = (e: { final: Heuristic; item: BacklogItem }) => {
        let s = 0;
        if (e.final.effort === 'S' && e.final.impact === 'H') s = 3;
        else if (e.final.effort === 'S' && e.final.impact === 'M') s = 2;
        else s = 1;
        return s;
      };
      return score(b) - score(a) || a.item.id - b.item.id;
    });

  lines.push(`## Quick wins (${quickWins.length})`);
  lines.push('');
  lines.push('| ID | Effort | Impact | Categoria | Titulo |');
  lines.push('|----|--------|--------|-----------|--------|');
  for (const e of quickWins) {
    const titleShort = e.item.title.replace(/\|/g, '\\|').slice(0, 80);
    lines.push(
      `| #${e.item.id} | ${e.final.effort} | ${e.final.impact} | ${e.final.category} | ${titleShort} |`
    );
  }
  lines.push('');

  lines.push('## Por categoria');
  lines.push('');
  const orderedCats: Category[] = [
    'directores',
    'perfil',
    'admin',
    'ai',
    'catalogo',
    'noticias',
    'seo',
    'i18n',
    'cleanup',
    'infra',
  ];
  for (const cat of orderedCats) {
    const list = byCategory.get(cat);
    if (!list || list.length === 0) continue;
    lines.push(`### ${cat} (${list.length})`);
    lines.push('');
    lines.push('| ID | E/I | QW | Titulo |');
    lines.push('|----|-----|----|--------|');
    for (const e of list) {
      const titleShort = e.item.title.replace(/\|/g, '\\|').slice(0, 80);
      lines.push(
        `| #${e.item.id} | ${e.final.effort}/${e.final.impact} | ${e.isQuickWin ? '⚡' : ''} | ${titleShort} |`
      );
    }
    lines.push('');
  }

  lines.push('## Notas');
  lines.push('');
  lines.push('- Esta categorizacion es heuristica (keyword-matching + longitud de description). Items mal clasificados se corrigen editando el prefijo manualmente en `FeatureRequest.description`.');
  lines.push('- Para re-ejecutar: `npx tsx scripts/triage-backlog-2026-05-13.ts --report`.');
  lines.push('- Para aplicar prefijos: agregar `--apply`. Idempotente.');
  return lines.join('\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
