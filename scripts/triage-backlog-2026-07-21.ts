/* eslint-disable no-console */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type FeatureRequestPriority,
} from '../src/generated/prisma';

/**
 * Triage + ranking ROI del backlog — 2026-07-21.
 *
 * Objetivo: sobre los FeatureRequest OPEN, (1) reclasificar type (bug/feature/idea)
 * corrigiendo los bugs de Flor mal tipados como feature, (2) ajustar priority de
 * bugs que bloquean el uso diario, (3) asignar bucket + score ROI y (4) escribir
 * un prefijo [cat:X][effort:Y][impact:Z] en description (idempotente).
 *
 * ROI = seguridad*2 + urgencia*1.5 + claridad*1 + importancia*1 (ejes 0-3).
 * Orden de buckets (bugs de Flor primero): BUG_FLOR > SECURITY > VERIFY >
 * FEATURE_ROADMAP > CLEANUP. Dentro de cada bucket, por score desc.
 *
 * Reutiliza el patrón de scripts/triage-backlog-2026-05-13.ts (parsePrefix/prefijo).
 *
 * Uso:
 *   npx tsx scripts/triage-backlog-2026-07-21.ts            # dry-run (default)
 *   npx tsx scripts/triage-backlog-2026-07-21.ts --report   # genera markdown
 *   npx tsx scripts/triage-backlog-2026-07-21.ts --apply     # escribe type/priority/prefijos
 *   npx tsx scripts/triage-backlog-2026-07-21.ts --apply --report
 */

const APPLY = process.argv.includes('--apply');
const REPORT = process.argv.includes('--report');
const REPORT_PATH = 'docs/backlog-triage-2026-07-21.md';

type Bucket = 'BUG_FLOR' | 'SECURITY' | 'VERIFY' | 'FEATURE_ROADMAP' | 'CLEANUP';
type ReqType = 'bug' | 'feature' | 'idea';
type Category =
  | 'catalogo'
  | 'perfil'
  | 'admin'
  | 'ai'
  | 'noticias'
  | 'directores'
  | 'seo'
  | 'i18n'
  | 'cleanup'
  | 'infra';
type Effort = 'S' | 'M' | 'L' | 'XL';
type ImpactLetter = 'L' | 'M' | 'H';

const BUCKET_ORDER: Bucket[] = [
  'BUG_FLOR',
  'SECURITY',
  'VERIFY',
  'FEATURE_ROADMAP',
  'CLEANUP',
];
const BUCKET_LABEL: Record<Bucket, string> = {
  BUG_FLOR: 'Bugs de Flor (funcionales)',
  SECURITY: 'Seguridad / privacidad',
  VERIFY: 'Verificar (implementado sin testear)',
  FEATURE_ROADMAP: 'Features roadmap',
  CLEANUP: 'Cleanup / tech-debt',
};

/** ROI: [seguridad, claridad, importancia, urgencia] (0-3 cada uno). */
type Roi = [number, number, number, number];

interface Curated {
  type?: ReqType;
  priority?: FeatureRequestPriority;
  bucket: Bucket;
  category: Category;
  effort: Effort;
  roi: Roi;
  note?: string;
}

// Curación manual (leída caso por caso). Lo no listado cae al heurístico.
const CURATED: Record<number, Curated> = {
  // --- BUG_FLOR: bugs funcionales, muchos mal tipados como "feature" ---
  30: { type: 'bug', priority: 'HIGH', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'M', roi: [0, 3, 3, 3], note: 'No se puede agregar contenido salvo entrando a editar; aparece al fondo' },
  132: { type: 'bug', priority: 'HIGH', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'M', roi: [0, 3, 2, 3], note: 'Especiales no muestran cantidad de episodios; el campo desaparece al editar' },
  133: { type: 'bug', priority: 'HIGH', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'M', roi: [0, 2, 2, 3], note: 'En "Viendo" las series no aparecen enteras' },
  93: { bucket: 'BUG_FLOR', category: 'catalogo', effort: 'M', roi: [0, 3, 2, 2], note: 'Episodios: nombre + duración no se muestran en /series/[id]' },
  113: { type: 'bug', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'M', roi: [0, 3, 2, 2], note: 'Bloques info adicional: solo al editar, no al crear (paridad crear/editar)' },
  12: { type: 'bug', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'S', roi: [0, 3, 2, 2], note: 'Universos con +3 títulos muestran solo 2 y descolocan a las vecinas' },
  128: { type: 'bug', bucket: 'BUG_FLOR', category: 'seo', effort: 'S', roi: [1, 3, 2, 2], note: 'Aparece mundobl.win en el inicio (debería ser mundobl.com.ar)' },
  130: { type: 'bug', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'S', roi: [0, 3, 1, 2], note: 'Typo "tempoaradas"→"temporada" + UX de temporadas' },
  42: { type: 'bug', bucket: 'BUG_FLOR', category: 'catalogo', effort: 'S', roi: [0, 2, 1, 2], note: 'No figuran todos los países en el contador' },
  40: { bucket: 'BUG_FLOR', category: 'catalogo', effort: 'S', roi: [0, 3, 1, 2], note: 'Tarea de datos: borrar T2 de Addicted Heroin (ya existe scripts/delete-addicted-s2.ts)' },

  // --- SECURITY ---
  69: { bucket: 'SECURITY', category: 'infra', effort: 'M', roi: [3, 3, 2, 2], note: 'OAuth client vive en proyecto ajeno AEGIS → aislar a proyecto propio + rotar secretos' },
  26: { bucket: 'SECURITY', category: 'admin', effort: 'M', roi: [2, 2, 2, 1], note: 'Ban de usuarios + bloqueo por IP — implementado, SIN verificar en runtime' },
  25: { bucket: 'SECURITY', category: 'admin', effort: 'S', roi: [2, 2, 1, 1], note: 'Banner de privacidad — implementado, SIN verificar' },
  23: { bucket: 'SECURITY', category: 'infra', effort: 'M', roi: [2, 2, 1, 1], note: 'Access logs — implementado, SIN verificar' },
  24: { bucket: 'SECURITY', category: 'admin', effort: 'M', roi: [1, 2, 1, 1], note: 'Panel admin de logs — implementado, SIN verificar' },

  // --- FEATURE_ROADMAP: HIGH y features con spec clara ---
  52: { bucket: 'FEATURE_ROADMAP', category: 'ai', effort: 'L', roi: [0, 3, 3, 2] },
  92: { bucket: 'FEATURE_ROADMAP', category: 'ai', effort: 'L', roi: [0, 3, 3, 2] },
  109: { bucket: 'FEATURE_ROADMAP', category: 'ai', effort: 'XL', roi: [0, 3, 3, 2] },
  110: { bucket: 'FEATURE_ROADMAP', category: 'ai', effort: 'L', roi: [0, 3, 3, 2] },
  111: { bucket: 'FEATURE_ROADMAP', category: 'ai', effort: 'L', roi: [0, 3, 3, 2] },
  112: { bucket: 'FEATURE_ROADMAP', category: 'admin', effort: 'M', roi: [0, 3, 2, 2] },
  97: { bucket: 'FEATURE_ROADMAP', category: 'admin', effort: 'M', roi: [0, 3, 2, 2] },
  87: { bucket: 'FEATURE_ROADMAP', category: 'catalogo', effort: 'XL', roi: [0, 3, 2, 2] },
  119: { bucket: 'FEATURE_ROADMAP', category: 'directores', effort: 'L', roi: [0, 3, 2, 2] },
  120: { bucket: 'FEATURE_ROADMAP', category: 'directores', effort: 'M', roi: [0, 2, 2, 1] },
  44: { bucket: 'FEATURE_ROADMAP', category: 'noticias', effort: 'M', roi: [0, 3, 2, 2] },
  131: { bucket: 'FEATURE_ROADMAP', category: 'catalogo', effort: 'S', roi: [0, 3, 1, 1], note: 'Botón editar serie también arriba' },
  116: { bucket: 'FEATURE_ROADMAP', category: 'perfil', effort: 'S', roi: [0, 3, 1, 1] },
  89: { bucket: 'FEATURE_ROADMAP', category: 'perfil', effort: 'M', roi: [0, 3, 2, 1] },

  // --- CLEANUP / tech-debt ---
  114: { bucket: 'CLEANUP', category: 'perfil', effort: 'S', roi: [0, 3, 2, 2], note: 'Bump dashboardKey v5→v6: quick-win, evita slots vacíos en layouts cacheados' },
  68: { bucket: 'CLEANUP', category: 'cleanup', effort: 'S', roi: [0, 3, 1, 1] },
  115: { bucket: 'CLEANUP', category: 'i18n', effort: 'S', roi: [0, 3, 1, 1] },
  88: { bucket: 'CLEANUP', category: 'perfil', effort: 'S', roi: [0, 3, 1, 1] },
  73: { bucket: 'CLEANUP', category: 'i18n', effort: 'M', roi: [0, 2, 1, 1] },
  76: { bucket: 'CLEANUP', category: 'cleanup', effort: 'M', roi: [0, 3, 1, 1] },
};

const PREFIX_REGEX =
  /^(\[cat:[a-z-]+\])?\s*(\[effort:(S|M|L|XL)\])?\s*(\[impact:(L|M|H)\])?\s*/;

function hasPrefix(description: string | null): boolean {
  const m = (description ?? '').match(PREFIX_REGEX);
  return !!(m && (m[1] || m[2] || m[4]));
}

const REVERTED_MARK = '⚠ REVERTIDO';
function isReverted(description: string | null): boolean {
  return (description ?? '').trimStart().startsWith(REVERTED_MARK);
}

const SECURITY_KW =
  /\b(oauth|seguridad|security|privacidad|privacy|ban|bloqueo|ip|auth|token|secret|gdpr)\b/i;

interface Item {
  id: number;
  title: string;
  description: string | null;
  type: string;
  priority: FeatureRequestPriority;
}

interface Enriched {
  item: Item;
  bucket: Bucket;
  category: Category;
  effort: Effort;
  roi: Roi;
  score: number;
  newType: ReqType;
  newPriority: FeatureRequestPriority;
  typeChanged: boolean;
  priorityChanged: boolean;
  note?: string;
  reverted: boolean;
}

function scoreOf(roi: Roi): number {
  const [seg, clar, imp, urg] = roi;
  return seg * 2 + urg * 1.5 + clar * 1 + imp * 1;
}

function impactLetter(imp: number): ImpactLetter {
  return imp >= 3 ? 'H' : imp >= 2 ? 'M' : 'L';
}

function heuristicRoi(item: Item, reverted: boolean): Roi {
  const seg = SECURITY_KW.test(`${item.title} ${item.description ?? ''}`) ? 2 : 0;
  const clar = reverted ? 2 : 2;
  const impByPrio =
    item.priority === 'HIGH' || item.priority === 'CRITICAL'
      ? 3
      : item.priority === 'LOW'
        ? 1
        : 2;
  const urg =
    item.priority === 'HIGH' || item.priority === 'CRITICAL'
      ? 2
      : item.priority === 'LOW'
        ? 1
        : 1;
  return [seg, clar, impByPrio, urg];
}

function heuristicBucket(item: Item, reverted: boolean): Bucket {
  if (reverted) return 'VERIFY';
  if (item.type === 'bug') return 'CLEANUP';
  if (SECURITY_KW.test(`${item.title} ${item.description ?? ''}`)) return 'SECURITY';
  if (item.priority === 'LOW') return 'CLEANUP';
  return 'FEATURE_ROADMAP';
}

function heuristicCategory(item: Item): Category {
  const h = `${item.title} ${item.description ?? ''}`.toLowerCase();
  if (/noticia|news|markdown/.test(h)) return 'noticias';
  if (/director|filmograf/.test(h)) return 'directores';
  if (/gemini|\bia\b|\bai\b|recomend|recommend/.test(h)) return 'ai';
  if (/perfil|profile|dashboard|widget|reseñ|review|coment/.test(h)) return 'perfil';
  if (/admin|moderaci|panel|usuario|ban|log/.test(h)) return 'admin';
  if (/i18n|locale|traducc|idioma|messages/.test(h)) return 'i18n';
  if (/seo|sitemap|schema\.org|llms|breadcrumb|dominio|\.win/.test(h)) return 'seo';
  if (/oauth|cron|cache|deploy|infra|cloudflare|migrac/.test(h)) return 'infra';
  if (/limpiar|cleanup|refactor|import|huerfan|warning/.test(h)) return 'cleanup';
  return 'catalogo';
}

function heuristicEffort(item: Item): Effort {
  const len = (item.description ?? '').length;
  const h = `${item.title} ${item.description ?? ''}`.toLowerCase();
  if (/rediseñ|reescrib|migracion masiva|xl/.test(h)) return 'XL';
  if (len > 700 || /fase 2|fase 3|nuevo modelo|sistema/.test(h)) return 'L';
  if (len < 160) return 'S';
  return 'M';
}

function enrich(item: Item): Enriched {
  const reverted = isReverted(item.description);
  const c = CURATED[item.id];
  const bucket = c?.bucket ?? heuristicBucket(item, reverted);
  const category = c?.category ?? heuristicCategory(item);
  const effort = c?.effort ?? heuristicEffort(item);
  const roi = c?.roi ?? heuristicRoi(item, reverted);
  const newType = (c?.type ?? (item.type as ReqType)) as ReqType;
  const newPriority = c?.priority ?? item.priority;
  return {
    item,
    bucket,
    category,
    effort,
    roi,
    score: scoreOf(roi),
    newType,
    newPriority,
    typeChanged: newType !== item.type,
    priorityChanged: newPriority !== item.priority,
    note: c?.note,
    reverted,
  };
}

function buildPrefix(e: Enriched): string {
  return `[cat:${e.category}][effort:${e.effort}][impact:${impactLetter(e.roi[2])}]`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    `=== Triage backlog 2026-07-21 ${APPLY ? '(APPLY)' : '(DRY-RUN)'}${REPORT ? ' +REPORT' : ''} ===\n`
  );

  const items = (await prisma.featureRequest.findMany({
    where: { status: 'OPEN' },
    orderBy: [{ id: 'asc' }],
    select: { id: true, title: true, description: true, type: true, priority: true },
  })) as Item[];

  const enriched = items.map(enrich);
  const byBucket = new Map<Bucket, Enriched[]>();
  for (const e of enriched) {
    const arr = byBucket.get(e.bucket) ?? [];
    arr.push(e);
    byBucket.set(e.bucket, arr);
  }
  for (const arr of byBucket.values()) {
    arr.sort((a, b) => b.score - a.score || a.item.id - b.item.id);
  }

  // Consola: por bucket
  for (const bucket of BUCKET_ORDER) {
    const list = byBucket.get(bucket);
    if (!list || !list.length) continue;
    console.log(`\n### ${bucket} — ${BUCKET_LABEL[bucket]} (${list.length})`);
    for (const e of list) {
      const chg = [
        e.typeChanged ? `type:${e.item.type}→${e.newType}` : '',
        e.priorityChanged ? `prio:${e.item.priority}→${e.newPriority}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      console.log(
        `  #${String(e.item.id).padStart(3)} s=${e.score.toFixed(1).padStart(4)} ` +
          `[${e.category}/${e.effort}/${impactLetter(e.roi[2])}] ` +
          `${e.item.title.slice(0, 46).padEnd(46)} ${chg}`
      );
    }
  }

  const typeChanges = enriched.filter((e) => e.typeChanged);
  const prioChanges = enriched.filter((e) => e.priorityChanged);
  console.log(
    `\n--- Totales: ${enriched.length} OPEN | reclasif type: ${typeChanges.length} | reclasif priority: ${prioChanges.length} ---`
  );
  for (const b of BUCKET_ORDER) {
    console.log(`    ${b}: ${byBucket.get(b)?.length ?? 0}`);
  }

  if (APPLY) {
    let typeU = 0;
    let prioU = 0;
    let prefixU = 0;
    for (const e of enriched) {
      const data: {
        type?: string;
        priority?: FeatureRequestPriority;
        description?: string;
      } = {};
      if (e.typeChanged) {
        data.type = e.newType;
        typeU++;
      }
      if (e.priorityChanged) {
        data.priority = e.newPriority;
        prioU++;
      }
      if (!hasPrefix(e.item.description)) {
        const current = e.item.description ?? '';
        data.description = `${buildPrefix(e)} ${current}`.trim();
        prefixU++;
      }
      if (Object.keys(data).length === 0) continue;
      await prisma.featureRequest.update({ where: { id: e.item.id }, data });
    }
    console.log(
      `\nApply: type ${typeU}, priority ${prioU}, prefijos ${prefixU} escritos.`
    );
  }

  if (REPORT) {
    const md = renderReport(enriched, byBucket);
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, md, 'utf8');
    console.log(`\nReport escrito: ${REPORT_PATH}`);
  }
}

function renderReport(
  enriched: Enriched[],
  byBucket: Map<Bucket, Enriched[]>
): string {
  const L: string[] = [];
  L.push('# Backlog triage + ranking ROI — 2026-07-21');
  L.push('');
  L.push(
    `Generado por \`scripts/triage-backlog-2026-07-21.ts\`. Total OPEN: **${enriched.length}**.`
  );
  L.push('');
  L.push('## Rúbrica ROI');
  L.push('');
  L.push('Ejes 0–3: **seguridad**, **claridad** (accionable/repro), **importancia** (afecta a todos/desbloquea), **urgencia** (roto en prod hoy).');
  L.push('`score = seguridad*2 + urgencia*1.5 + claridad*1 + importancia*1`');
  L.push('');
  L.push('Buckets (orden de trabajo, bugs de Flor primero): ' + BUCKET_ORDER.map((b) => `**${b}**`).join(' → ') + '.');
  L.push('');

  // Ranking global
  const globalOrder = BUCKET_ORDER.flatMap((b) => byBucket.get(b) ?? []);
  L.push('## Ranking global');
  L.push('');
  L.push('| # | Bucket | Score | Cat/Effort/Impact | Type | Prio | Título |');
  L.push('|---|--------|-------|-------------------|------|------|--------|');
  for (const e of globalOrder) {
    const t = e.typeChanged ? `${e.item.type}→**${e.newType}**` : e.newType;
    const p = e.priorityChanged ? `${e.item.priority}→**${e.newPriority}**` : e.newPriority;
    const title = e.item.title.replace(/\|/g, '\\|').slice(0, 60);
    L.push(
      `| ${e.item.id} | ${e.bucket} | ${e.score.toFixed(1)} | ${e.category}/${e.effort}/${impactLetter(e.roi[2])} | ${t} | ${p} | ${title} |`
    );
  }
  L.push('');

  // Por bucket con notas
  for (const bucket of BUCKET_ORDER) {
    const list = byBucket.get(bucket);
    if (!list || !list.length) continue;
    L.push(`## ${bucket} — ${BUCKET_LABEL[bucket]} (${list.length})`);
    L.push('');
    L.push('| # | Score | E/I | Título | Nota |');
    L.push('|---|-------|-----|--------|------|');
    for (const e of list) {
      const title = e.item.title.replace(/\|/g, '\\|').slice(0, 50);
      const note = (e.note ?? '').replace(/\|/g, '\\|').slice(0, 90);
      L.push(`| ${e.item.id} | ${e.score.toFixed(1)} | ${e.effort}/${impactLetter(e.roi[2])} | ${title} | ${note} |`);
    }
    L.push('');
  }

  // Reclasificaciones
  const typeChanges = enriched.filter((e) => e.typeChanged);
  const prioChanges = enriched.filter((e) => e.priorityChanged);
  L.push('## Reclasificaciones aplicadas');
  L.push('');
  L.push(`**Type** (${typeChanges.length}): ` + typeChanges.map((e) => `#${e.item.id} ${e.item.type}→${e.newType}`).join(', '));
  L.push('');
  L.push(`**Priority** (${prioChanges.length}): ` + prioChanges.map((e) => `#${e.item.id} ${e.item.priority}→${e.newPriority}`).join(', '));
  L.push('');

  // Checklist VERIFY
  const verify = byBucket.get('VERIFY') ?? [];
  L.push(`## VERIFY — checklist de verificación humana (${verify.length})`);
  L.push('');
  L.push('Items marcados como implementados pero **sin testear en runtime** (batch revertido a OPEN). Verificar cada uno end-to-end y cerrar (COMPLETED) o reabrir con detalle del bug. Cerrarlos baja el backlog real.');
  L.push('');
  for (const e of verify) {
    L.push(`- [ ] #${e.item.id} — ${e.item.title}`);
  }
  L.push('');

  L.push('## Notas');
  L.push('');
  L.push('- Categoría/effort/impact persisten como prefijo `[cat:X][effort:Y][impact:Z]` en `FeatureRequest.description` (idempotente; no re-prefija).');
  L.push('- Re-ejecutar: `npx tsx scripts/triage-backlog-2026-07-21.ts --report`. Aplicar: agregar `--apply`.');
  L.push('- El bug de tags duplicados reportado por Flor se corrigió en código esta sesión (`src/lib/tag-utils.ts` + 3 rutas de series).');
  return L.join('\n');
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
