// Cleanup de FeatureRequest tras la sesion de mayo 2026:
// - Marca COMPLETED las que se hicieron en la sesion (SeriesInfoBlock,
//   SEO Fase 1, Auditoria i18n)
// - Recategoriza algunos type=feature a type=bug o type=idea segun
//   corresponda
// - Agrega 7 items nuevos identificados durante la sesion (server
//   component i18n, retry de Japones, etc.)
//
// Idempotente: skip-if-already-state. Correr varias veces no duplica
// ni revierte estados.
//
// Uso: npx tsx scripts/cleanup-feature-requests.ts

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type FeatureRequestStatus,
  type FeatureRequestPriority,
} from '../src/generated/prisma';

interface StatusUpdate {
  id: number;
  status: FeatureRequestStatus;
  reason: string;
}

interface TypeReclassification {
  id: number;
  newType: 'bug' | 'feature' | 'idea';
  reason: string;
}

interface NewItem {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'idea';
  priority: FeatureRequestPriority;
}

const STATUS_UPDATES: StatusUpdate[] = [
  {
    id: 51,
    status: 'COMPLETED',
    reason: 'SeriesInfoBlock generico implementado en commit 54f4db6',
  },
  {
    id: 62,
    status: 'COMPLETED',
    reason: 'SEO Fase 1 implementado: robots por seccion + sitemap segmentado (ef155d7) + JSON-LD audit (fb0f607)',
  },
  {
    id: 65,
    status: 'COMPLETED',
    reason: 'Auditoria i18n admin idiomas: 31 components migrados a useLocale().t() + 10 locales reales con traducciones via Gemini (commits 13126be, db425cb)',
  },
];

const TYPE_RECLASSIFICATIONS: TypeReclassification[] = [
  // Items grandes y especulativos suelen ser ideas, no features con scope definido
  {
    id: 56,
    newType: 'idea',
    reason: 'Comparador 1v1 — concepto, scope no definido aun',
  },
  {
    id: 58,
    newType: 'idea',
    reason: 'Heatmap publico — concepto exploratorio',
  },
  {
    id: 64,
    newType: 'idea',
    reason: 'SEO Fase 3 (llms.txt + /api/ai-map) — exploratorio, depende de adopcion de standards',
  },
  // El item #66 ("Landing quitar bloques relacionados a IA") es removal de UI
  // existente, no feature nueva — se trata como bug de UX
  {
    id: 66,
    newType: 'bug',
    reason: 'Removal de UI existente, no feature nueva',
  },
];

const NEW_ITEMS: NewItem[] = [
  {
    title: 'Re-correr migracion i18n para 26 archivos fallidos en batch',
    description:
      'En la sesion de mayo 2026 el batch auto-i18n migro 31/58 archivos OK, pero 26 fallaron: 10 por type-check post-revert (interpolation issues, helpers con t signature) y 16 por validation (output Gemini con keys mal formadas, nested objects, missing en). Mejorar el prompt y re-correr scripts/auto-i18n-file.ts sobre cada uno. Lista en /tmp/i18n-batch-summary.log o regenerar via scripts/audit-i18n.ts.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Helper i18n server-side para components que no son client',
    description:
      'useLocale().t() es un hook client-only. Server components (ej. /series/[id]/page.tsx) no pueden usarlo. Crear un helper getServerLocale() + tServer(key) que lea locale de cookies via next/headers, importe MESSAGES directamente, y permita traducir strings en server components. Necesario para completar la migracion i18n del 100% del proyecto.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Japones (ja): batch size 20 + prompt mas estricto en translate-locales',
    description:
      'translate-locales.ts falla repetidamente para japones en algun batch (Gemini devuelve 39 strings cuando se pide 40, mismo bug en 3 retries). Reducir BATCH_SIZE para ja a 20 (override por locale en TARGETS), agregar validacion explicita "exactly N strings" en prompt, o cachear partial progress entre batches.',
    type: 'bug',
    priority: 'LOW',
  },
  {
    title: 'Audit completo de regresiones post-auto-i18n',
    description:
      'En la migracion masiva se encontro 1 regresion (SeriesDetailClient: prop seasonLabel reemplazada por t() constante). Auditar los otros 30 archivos migrados buscando patron similar: prop tipada en interface pero no usada en body, o $variable interpolation reemplazada por t() estatica. Comando para encontrar candidatos: tsc --noUnusedParameters | grep "is declared but".',
    type: 'bug',
    priority: 'LOW',
  },
  {
    title: 'Limpiar imports no usados en admin/feedback/FeedbackClient',
    description:
      'El item #68 cubria FeedbackClient + BottomNav. BottomNav ya esta limpio. FeedbackClient (admin) sigue con 17 warnings de imports no usados (Button, Pagination, Tooltip, Empty, varios Outlined icons, FeedbackType, locale/t, editingCase, form, option). Es el archivo con mas warnings del proyecto.',
    type: 'bug',
    priority: 'LOW',
  },
  {
    title: 'Top N dinamicos en /admin/noticias (decisiones de diseño abiertas)',
    description:
      'Pedido de Flor: dentro del editor de noticias poder armar tops de N items (ej. "top 10 enemy-to-lovers", "top 5 musicales", "top 5 GMMTV"). Decisiones pendientes: 1) Fuente del orden inicial (UserRating? Rating admin? manual?). 2) Modelo congelado al publicar o vivo (re-calcula al cargar?). 3) Filtros: pais, tipo, genero, tag, productora, año desde-hasta. 4) Schema: extender News con kind (NEWS|TOP_LIST) + nuevo modelo NewsTopItem (newsId, seriesId, position, note).',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Refactor: USER_PUBLIC_SELECT compartido para Prisma queries',
    description:
      'Actualmente 16+ endpoints repiten manualmente el select { id, name, nickname, image } al fetch User para render publico. Centralizar en src/lib/user-selects.ts como `export const USER_PUBLIC_SELECT = { id: true, name: true, nickname: true, image: true } as const`. Cuando se sume otro campo publico (ej. avatar URL custom), un solo lugar. Reduce ruido + previene drift entre endpoints.',
    type: 'feature',
    priority: 'LOW',
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Status updates (mark COMPLETED) ===');
  let statusChanged = 0;
  let statusSkipped = 0;
  for (const upd of STATUS_UPDATES) {
    const current = await prisma.featureRequest.findUnique({
      where: { id: upd.id },
      select: { id: true, title: true, status: true },
    });
    if (!current) {
      console.log(`  [${upd.id}] NOT FOUND, skipping`);
      continue;
    }
    if (current.status === upd.status) {
      console.log(`  [${upd.id}] already ${upd.status}: "${current.title.slice(0, 50)}"`);
      statusSkipped++;
      continue;
    }
    await prisma.featureRequest.update({
      where: { id: upd.id },
      data: { status: upd.status },
    });
    console.log(`  [${upd.id}] ${current.status} → ${upd.status}: "${current.title.slice(0, 50)}"`);
    console.log(`     reason: ${upd.reason}`);
    statusChanged++;
  }

  console.log('\n=== Type reclassifications ===');
  let typeChanged = 0;
  let typeSkipped = 0;
  for (const r of TYPE_RECLASSIFICATIONS) {
    const current = await prisma.featureRequest.findUnique({
      where: { id: r.id },
      select: { id: true, title: true, type: true },
    });
    if (!current) {
      console.log(`  [${r.id}] NOT FOUND, skipping`);
      continue;
    }
    if (current.type === r.newType) {
      console.log(`  [${r.id}] already ${r.newType}: "${current.title.slice(0, 50)}"`);
      typeSkipped++;
      continue;
    }
    await prisma.featureRequest.update({
      where: { id: r.id },
      data: { type: r.newType },
    });
    console.log(`  [${r.id}] ${current.type} → ${r.newType}: "${current.title.slice(0, 50)}"`);
    console.log(`     reason: ${r.reason}`);
    typeChanged++;
  }

  console.log('\n=== New items ===');
  let created = 0;
  let exists = 0;
  for (const item of NEW_ITEMS) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: item.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [${existing.id}] already exists: "${item.title.slice(0, 60)}"`);
      exists++;
      continue;
    }
    const fr = await prisma.featureRequest.create({
      data: {
        title: item.title,
        description: item.description,
        type: item.type,
        priority: item.priority,
      },
      select: { id: true },
    });
    console.log(`  [${fr.id}] created [${item.priority}/${item.type}]: "${item.title.slice(0, 60)}"`);
    created++;
  }

  console.log('\n=== Final stats ===');
  const all = await prisma.featureRequest.findMany({
    select: { status: true, type: true },
  });
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const fr of all) {
    byStatus[fr.status] = (byStatus[fr.status] || 0) + 1;
    byType[fr.type] = (byType[fr.type] || 0) + 1;
  }
  console.log(`Total: ${all.length}`);
  console.log(`By status:`, byStatus);
  console.log(`By type:`, byType);
  console.log(
    `\nDone. Status changed: ${statusChanged} (${statusSkipped} already done). Type changed: ${typeChanged} (${typeSkipped} already correct). New: ${created} (${exists} already exist).`
  );
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
