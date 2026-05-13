/* eslint-disable no-console */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type FeatureRequestStatus,
  type FeatureRequestPriority,
} from '../src/generated/prisma';

/**
 * Audit del backlog 2026-05-13:
 * - Deja AUDIT_COMMENTS idempotentes en items con cobertura parcial relevantes al
 *   slice de hoy (#109/#110/#111 siguen OPEN — la evidencia muestra parcialidad,
 *   ver scripts/comment-ver-agregar-progress.ts).
 * - Crea NEW_ITEMS que el slice de hoy necesita en DB (score completitud series,
 *   director: aliases, director: links externos).
 * - Cierra como COMPLETED solo items con evidencia firme (CLOSE_AS_COMPLETED).
 *   Hoy: vacio. Si el triage encuentra mas, agregar aqui.
 *
 * Idempotente: skip-if-already-state + dedup por title (items) y marker (comments).
 *
 * Uso:
 *   npx tsx scripts/audit-2026-05-13.ts            # dry-run (default)
 *   npx tsx scripts/audit-2026-05-13.ts --apply    # ejecuta cambios
 */

const MARKER = '[audit-2026-05-13]';
const APPLY = process.argv.includes('--apply');

interface AuditComment {
  featureRequestId: number;
  body: string;
}

interface NewItem {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'idea';
  priority: FeatureRequestPriority;
  initialStatus?: FeatureRequestStatus; // default OPEN
}

interface StatusClose {
  id: number;
  status: FeatureRequestStatus;
  reason: string;
}

const AUDIT_COMMENTS: AuditComment[] = [
  {
    featureRequestId: 109,
    body: `${MARKER} Revisado: sigue OPEN/parcial.

Lado USER_EMBED (/ver/agregar) confirmado en codigo: src/lib/user-embed-preview.ts + /api/user/series/embed/confirm + /admin/series/user-submitted. Cobertura del bloque ya documentada en comment [ver-iter 2026-05-12].

Pendiente confirmado para cerrar este item:
- Lado admin: boton "Agregar con AI" en /admin/series/nueva (SeriesForm) que reuse buildEmbedPreview con fuentes IMDB/MDL/titulo libre.
- Implementacion del mock style-guide/new-seri-mock.png para el flow admin.

Relacionado con triage 2026-05-13: ver docs/backlog-triage-2026-05-13.md (Bloque 1er slice).`,
  },
  {
    featureRequestId: 110,
    body: `${MARKER} Revisado: sigue OPEN/parcial.

Integracion Gemini confirmada en 6 callsites (src/lib/gemini.ts → playlist-importer, user-embed-preview, reviews/ai-assist, admin changelog ai-assist, admin news ai-generate, reviews route).

Pendiente confirmado:
- Boton "AI fill" en SeriesForm admin que rellene campos vacios sin pisar lo cargado (#92).
- Validacion semantica de coherencia year/country.
- Auto-suggest interactivo de tags/generos en form (hoy solo precarga).

Relacionado con triage 2026-05-13: ver docs/backlog-triage-2026-05-13.md.`,
  },
  {
    featureRequestId: 111,
    body: `${MARKER} Revisado: sigue OPEN/parcial.

Cobertura oEmbed (YouTube/Vimeo/Bilibili/Dailymotion) confirmada. NO existe scraping de IMDB ni MyDramaList (cero referencias en src/ a esos providers como fuente de scraping; solo aparecen como social links de usuario).

Pendiente confirmado:
- Endpoints fuente: /api/user/series/discover?source=imdb&id=tt... y equivalente MDL.
- Decision tecnica: Gemini grounding (web search nativo) vs scraping directo.

Este item va a slice 3 (roadmap). Relacionado con triage 2026-05-13: ver docs/backlog-triage-2026-05-13.md.`,
  },
];

const NEW_ITEMS: NewItem[] = [
  {
    title: 'Score de completitud para series (admin/editor)',
    description:
      '[completed:43b4644] Metrica de curacion 0-100 computada on-the-fly sobre Series (sin migracion). Pesos: synopsis 15, poster 15, cast 15, director 10, tags >=3 10, review 10, soundtrack 10, country 5, year 5, originalTitle 5 (suman 100). Helper src/lib/series-completeness.ts (puro). Visible en /admin/series/[id] como CompletenessCard al tope del overview tab (PanelCard + Chip + Ant Progress). NO publico — metrica interna de curacion. Widget SeriesIncompletasWidget en /perfil para rol admin queda diferido a slice 1.5.',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Directores: aliases (nombres alternativos)',
    description:
      '[completed:43b4644] Campo Director.aliases String[] @default([]). Migracion add_director_aliases_and_external_links (combinada con links externos). Renderizado en /directores/[id] como Chip list con tone neutral debajo del nombre principal. Editable desde admin form (Ant Select mode="tags" con tokenSeparators=","). Enriquece JSON-LD con alternateName.',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Directores: links externos (IMDB, MDL, Wiki)',
    description:
      '[completed:43b4644] Campos Director.imdbUrl/mdlUrl/wikiUrl (String?). Migracion add_director_aliases_and_external_links. Render en /directores/[id] como nav con links clicables (icono LinkOutlined + label i18n) debajo del nombre, condicional por campo. Editable desde admin form (Ant Input con rules type="url"). JSON-LD enriquecido con sameAs. Otros campos del item original (birthYear, awards, obras destacadas) quedan para slice 2.',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
];

const CLOSE_AS_COMPLETED: StatusClose[] = [
  // Hoy vacio: la evidencia disponible no confirma cierres mas alla de los ya
  // marcados COMPLETED en cleanup-feature-requests.ts (#51, #62, #65).
  // El triage del Item 2 puede sumar items aqui.
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`=== Audit backlog 2026-05-13 ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`);

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', email: 'juanjparedez@gmail.com' },
    select: { id: true },
  });
  if (!admin) {
    console.error('No se encontro admin Juan en la DB. Abortando.');
    process.exit(1);
  }

  console.log('--- Audit comments ---');
  let auditAdded = 0;
  let auditSkipped = 0;
  for (const entry of AUDIT_COMMENTS) {
    const fr = await prisma.featureRequest.findUnique({
      where: { id: entry.featureRequestId },
      select: { id: true, title: true, status: true },
    });
    if (!fr) {
      console.log(`  [#${entry.featureRequestId}] NOT FOUND — skip`);
      continue;
    }
    const existing = await prisma.featureRequestComment.findFirst({
      where: {
        featureRequestId: entry.featureRequestId,
        body: { contains: MARKER },
      },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [#${entry.featureRequestId}] audit comment ya existe (id=${existing.id})`);
      auditSkipped++;
      continue;
    }
    if (APPLY) {
      await prisma.featureRequestComment.create({
        data: {
          featureRequestId: entry.featureRequestId,
          userId: admin.id,
          body: entry.body,
        },
      });
    }
    console.log(
      `  [#${entry.featureRequestId}] ${APPLY ? 'audit comment AGREGADO' : 'audit comment SE AGREGARIA'}: "${fr.title.slice(0, 50)}"`
    );
    auditAdded++;
  }

  console.log('\n--- New items ---');
  let created = 0;
  let exists = 0;
  for (const item of NEW_ITEMS) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: item.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [#${existing.id}] ya existe: "${item.title}"`);
      exists++;
      continue;
    }
    const status = item.initialStatus ?? 'OPEN';
    if (APPLY) {
      const fr = await prisma.featureRequest.create({
        data: {
          title: item.title,
          description: item.description,
          type: item.type,
          priority: item.priority,
          status,
        },
        select: { id: true },
      });
      console.log(`  [#${fr.id}] CREADO [${item.priority}/${item.type}/${status}]: "${item.title}"`);
    } else {
      console.log(`  [NEW] SE CREARIA [${item.priority}/${item.type}/${status}]: "${item.title}"`);
    }
    created++;
  }

  console.log('\n--- Close as COMPLETED ---');
  if (CLOSE_AS_COMPLETED.length === 0) {
    console.log('  (vacio — no hay items con evidencia firme para cerrar hoy)');
  } else {
    let closed = 0;
    let closeSkipped = 0;
    for (const c of CLOSE_AS_COMPLETED) {
      const current = await prisma.featureRequest.findUnique({
        where: { id: c.id },
        select: { id: true, title: true, status: true },
      });
      if (!current) {
        console.log(`  [#${c.id}] NOT FOUND — skip`);
        continue;
      }
      if (current.status === c.status) {
        console.log(`  [#${c.id}] ya es ${c.status} — skip`);
        closeSkipped++;
        continue;
      }
      if (APPLY) {
        await prisma.featureRequest.update({
          where: { id: c.id },
          data: { status: c.status },
        });
      }
      console.log(
        `  [#${c.id}] ${current.status} → ${c.status} ${APPLY ? '' : '(dry-run)'}: "${current.title.slice(0, 50)}"`
      );
      console.log(`     reason: ${c.reason}`);
      closed++;
    }
    console.log(`  Cerrados: ${closed} (skipped: ${closeSkipped}).`);
  }

  console.log('\n=== Resumen ===');
  console.log(
    `Audit comments: ${auditAdded} agregados, ${auditSkipped} skipped. New items: ${created} (${exists} ya existian). Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}.`
  );
  if (!APPLY) {
    console.log('\nPara aplicar: npx tsx scripts/audit-2026-05-13.ts --apply');
  }
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
