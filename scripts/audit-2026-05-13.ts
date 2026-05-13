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
      '[completed:43b4644] Campos Director.imdbUrl/mdlUrl/wikiUrl (String?). Migracion add_director_aliases_and_external_links. Render en /directores/[id] como nav con links clicables (icono LinkOutlined + label i18n) debajo del nombre, condicional por campo. Editable desde admin form (Ant Input con rules type="url"). JSON-LD enriquecido con sameAs.',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Directores: birthYear + awards + obras destacadas',
    description:
      '[completed:0c726b9] Slice 2 director rico (continuacion de aliases/links del slice 1). Schema: Director.birthYear Int? + Director.awards String[] @default([]). Migracion add_director_birth_year_and_awards. Admin: InputNumber (range 1900..currentYear) + Select mode="tags" con separador ";". Publico: chip de birthYear + seccion "Premios" con icono trofeo + seccion "Obras destacadas" auto-derivada del top 3 por overallRating (solo si >=2 series tienen rating; no inventa data). JSON-LD enriquecido (birthDate + award).',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  // Bloque catalogo + navegacion (2026-05-13 tarde/noche)
  {
    title: 'Catalogo: universe card panel flotaba tapando siguiente fila',
    description:
      '[completed:6300c47+60cb9d0] .universe-expand-panel tenia position:absolute top:100% z-index:10 — al expandir "Ver series" en un universo, la lista de series flotaba sobre la fila siguiente del grid tapando otras cards. Cambiado a flujo normal: el panel crece dentro del wrapper, el grid ajusta la altura de la fila al card mas alto. Comportamiento consistente con +info de single cards.',
    type: 'bug',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Catalogo: estado expandido single/universo unificado',
    description:
      '[completed:5a27bf8] Refactor: expandedInfoCardId (string|null + sessionStorage) + expandedUniverses (Set<number> + sessionStorage) unificados en un solo expandedItemKey (string|null sin storage). Keys: "serie-${id}" o "universe-${id}". Solo una card expandida a la vez (single o universo). Abrir una cierra la otra. Al ir a /series/X y volver, F5, o cerrar pestaña: todo cerrado. -72/+19 lineas. Comportamiento natural alineado con como cierran los single cards entre si.',
    type: 'bug',
    priority: 'LOW',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'NavigationGuard global: back nativo nunca sale del sitio',
    description:
      '[completed:27bf01c] Componente client montado en root layout (src/components/layout/NavigationGuard/) que inyecta entry sintetica en history si referrer es externo. Mapa de fallbacks: /series/[id] → /catalogo, /directores/[id] → /catalogo, /noticias/X → /noticias, /admin/X/[id] → /admin/X, /perfil/* → /perfil, home de secciones → /. Idempotente via state marker (history.state.__mb_back_injected) y sessionStorage flag (__mb_first_nav_handled). Resuelve "back va al landing/sale del sitio" reportado por el usuario.',
    type: 'feature',
    priority: 'MEDIUM',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Catalogo: pagination usa push para back entry, filtros mantienen replace',
    description:
      '[completed:5f75f0e+f7e1ffb+2a34a5a] (1) Click en Pagination usa router.push → cada pagina es una back entry, page 1→2→5 + back retorna a 2 (no salta al referrer). (2) handleFilterChange (search keystroke, filtros) sigue usando router.replace para no inflar history con cada tecla. (3) Nuevo useEffect [searchParams] sincroniza state ← URL para que browser back/forward/backspace actualicen el contenido visible del catalogo. Resuelve "URL cambia pero contenido se queda en pagina 1".',
    type: 'bug',
    priority: 'HIGH',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'BackToCatalogButton + boton volver explicito en /series/[id]',
    description:
      '[completed:5f75f0e+27bf01c] Boton "← Volver al catalogo" arriba del breadcrumb en /series/[id]. Si vino del catalogo, llama router.back() (preserva ?page=N). Sino, router.push("/catalogo"). Componente client en src/components/series/BackToCatalogButton/. i18n: seriesDetail.backToCatalog. Complementa el back nativo (que ahora tambien funciona via NavigationGuard).',
    type: 'feature',
    priority: 'LOW',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'Migration faltante: Director +6 columnas (aliases, links, birthYear, awards)',
    description:
      '[completed:2c9167d] Bug reportado en prod (error digest 3266671265 en /series/1). Los commits de slice 1 (43b4644) + slice 2 (0c726b9) modificaron schema.prisma pero las migration files no se generaron (no habia DB local). Resultado: Prisma Client en build de Vercel SELECTea las columnas nuevas, DB sigue con schema viejo, queries de directors crashean Server Component. Generada migration `add_director_aliases_links_birth_awards` via `prisma migrate diff`. Para aplicar a prod: npm run migrate:supabase.',
    type: 'bug',
    priority: 'CRITICAL',
    initialStatus: 'COMPLETED',
  },
  {
    title: 'SEO polish: keywords + robots /scripts /data + JsonLd guard',
    description:
      '[completed:fab2847] layout.tsx keywords mas SEO-friendly (series tailandesas/coreanas/japonesas + dramas BL + series LGBTQ+). robots.ts bloquea /scripts y /data (no son rutas reales pero crawlers prueban convenciones). JsonLd.tsx con null guard runtime para no emitir <script> invalido si data viene null.',
    type: 'feature',
    priority: 'LOW',
    initialStatus: 'COMPLETED',
  },
];

// Items que YA existen en DB (creados via UI por Flor u otros) y queremos
// cerrar como COMPLETED. Lookup por title porque no conocemos los IDs
// localmente. Idempotente: si el item ya esta COMPLETED, skip.
interface CloseByTitle {
  title: string;
  reason: string;
}

const CLOSE_BY_TITLE: CloseByTitle[] = [
  {
    title: 'Volver al catálogo',
    reason:
      '[completed:5f75f0e+27bf01c+2a34a5a] Ticket de Flor: al volver atras al catalogo, queria que regrese a la pagina donde estaba (no a la 1). Implementado: ?page=N en URL + router.push en Pagination + useEffect sync state ← URL + boton explicito BackToCatalogButton + NavigationGuard global.',
  },
  {
    title: 'número de páginas',
    reason:
      '[completed:5f75f0e] Ticket de Flor: paginacion duplicada arriba del grid ademas de abajo. Implementado con CSS .catalogo-pagination--top y el mismo onChange handler.',
  },
  // Revision de tickets bug del backlog (2026-05-13 noche)
  {
    title: 'Bump dashboardKey de v5 → v6 (post-cleanup widgets)',
    reason:
      '[completed:TBD-this-commit] dashboardKey en DashboardClient.tsx pasa de v5 a v6. Invalida layouts cached con widgets borrados (SettingsRow, Overview, Ratings, YearSummary, ReviewsActivity, FollowedTitles) — los users veian "Missing widget" en slots.',
  },
  {
    title: 'Limpiar i18n keys huerfanas post-cleanup de /perfil',
    reason:
      '[completed:TBD-this-commit] 15 keys eliminadas del shape + es + en: profileDashboard.widgetOverview/Desc/Ratings/RatingsDesc + profile.overviewYearTotalHoursLabel + 5 pares profile.settingsCard{PublicName,Appearance,Sessions,Privacy,Danger}{Title,Desc}. 6 keys mantenidas (siguen usadas): sectionYearSummary, sectionReviewsActivity, sectionFollowedTitles, sectionSettings, settingsCardNotificationsTitle/Desc. Cast en 8 locales y en translate-{locales,missing-keys}.ts: as TranslationShape → as unknown as TranslationShape (necesario porque la separacion de shape vs locales crecio: locales tienen orphans + faltan completeness/directorProfile).',
  },
  {
    title: 'Episodios: nombre + duracion no se muestran en /series/[id]',
    reason:
      '[verified-implemented-already] Ya implementado en src/components/series/EpisodesList.tsx lineas 489-503: episode.title se renderiza como span con clase episodes-table__ep-title y episode.duration se renderiza como Tag con ClockCircleOutlined + "X min". No requiere trabajo adicional.',
  },
  {
    title: 'Empty space en /perfil overview cuando MyComments es corto',
    reason:
      '[obsolete-structure-changed] La estructura del overview original (3 columnas con MyCommentsPanel en columna derecha) ya no existe — /perfil migro a DashboardGrid + widgets (iter 18-19). MyCommentsWidget se renderiza en su propio row del grid, no en columna lateral. El bug es de una estructura que ya no esta en el codigo.',
  },
  {
    title: 'Audit completo de regresiones post-auto-i18n',
    reason:
      '[verified-no-regressions] Corri tsc --noUnusedParameters: solo 2 warnings no-i18n (admin/feedback FeedbackClient.tsx:280 \'name\' que es arg de column render; CurrentlyWatchingDashboard.tsx:168 \'seriesId\' que es arg de handler). Ninguna es prop-de-componente-replazada-por-t(). La migracion auto-i18n no dejo regresiones de ese patron.',
  },
];

const CLOSE_AS_COMPLETED: StatusClose[] = [
  // Hoy vacio: los cierres relevantes van por CLOSE_BY_TITLE (titulo) o
  // por NEW_ITEMS con initialStatus COMPLETED (items que se crean ya cerrados).
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

  console.log('\n--- Close by title (tickets creados via UI, ej. por Flor) ---');
  let closedByTitle = 0;
  let closeByTitleSkipped = 0;
  for (const entry of CLOSE_BY_TITLE) {
    const fr = await prisma.featureRequest.findFirst({
      where: { title: entry.title },
      select: { id: true, title: true, status: true },
    });
    if (!fr) {
      console.log(`  [title:"${entry.title}"] NOT FOUND — skip`);
      continue;
    }
    if (fr.status === 'COMPLETED') {
      console.log(`  [#${fr.id}] ya es COMPLETED — skip`);
      closeByTitleSkipped++;
      continue;
    }
    if (APPLY) {
      await prisma.featureRequest.update({
        where: { id: fr.id },
        data: { status: 'COMPLETED' },
      });
      // Tambien deja un comment con la razon/SHA para historia
      const hasComment = await prisma.featureRequestComment.findFirst({
        where: {
          featureRequestId: fr.id,
          body: { contains: MARKER },
        },
        select: { id: true },
      });
      if (!hasComment) {
        await prisma.featureRequestComment.create({
          data: {
            featureRequestId: fr.id,
            userId: admin.id,
            body: `${MARKER} ${entry.reason}`,
          },
        });
      }
    }
    console.log(
      `  [#${fr.id}] ${fr.status} → COMPLETED ${APPLY ? '' : '(dry-run)'}: "${fr.title}"`
    );
    console.log(`     reason: ${entry.reason}`);
    closedByTitle++;
  }
  if (closedByTitle === 0 && closeByTitleSkipped === 0) {
    console.log('  (no hay items a cerrar por titulo)');
  } else {
    console.log(`  Cerrados por titulo: ${closedByTitle} (skipped: ${closeByTitleSkipped}).`);
  }

  console.log('\n--- Close as COMPLETED (by id) ---');
  if (CLOSE_AS_COMPLETED.length === 0) {
    console.log('  (vacio — los cierres relevantes hoy van por CLOSE_BY_TITLE)');
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
