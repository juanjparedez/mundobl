import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

/**
 * Seed inicial del backlog en `FeatureRequest`.
 *
 * Estos items vivian en `ideas.md` y `retomar.md` como notas sueltas sin
 * tracking. Una vez insertados aca, los podemos votar/asignar/cerrar
 * desde /admin/feedback como cualquier solicitud, y borrar los .md.
 *
 * IDEMPOTENTE: skip por `title` exacto. Correr varias veces no duplica.
 *
 * Uso: `npx tsx scripts/seed-feature-requests.ts`
 *
 * Type: 'bug' | 'feature' | 'idea'
 * Priority: LOW | MEDIUM | HIGH | CRITICAL
 * Status (default): OPEN
 */

interface SeedItem {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'idea';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const ITEMS: SeedItem[] = [
  // ------- Noticias / Editor (rama wip/markdown-editor pendiente) -------
  {
    title: 'Editor Markdown para Noticias',
    description:
      'Resolver tipos pendientes en wip/markdown-editor: Form.Item render prop, Tabs API de antd 6 (activeKey + items), instalar @types/markdown-it. Branch ya tiene base.',
    type: 'feature',
    priority: 'HIGH',
  },
  {
    title: 'Upload de imagen de portada para Noticias',
    description:
      'Reusar /api/upload existente. Agregar campo en form admin de noticias. Crop 16:9. Guardar URL en News.imageUrl.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Pagina de detalle de noticia /noticias/[id]',
    description:
      'Server component con metadata dinamica (OG tags, twitter card). Render de markdown con markdown-it. Link a fuente original, tags, serie relacionada.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Comentarios en Noticias',
    description:
      'Tabla NewsComment (id, newsId, userId, body, createdAt). APIs GET/POST /api/news/[id]/comments. Seccion en /noticias/[id].',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Notificaciones in-app cuando se publica una Noticia',
    description:
      'Reusar src/lib/notifications.ts. Trigger en PATCH /api/admin/news cuando status pasa a PUBLISHED.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Tags UI mejorada en Noticias con auto-suggest',
    description:
      'Reemplazar input de tags por componente con auto-suggest sobre los tags existentes en el proyecto.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Tops por categoria editables desde /admin/noticias',
    description:
      'Extender News con kind ("NEWS" | "TOP_LIST") + tabla NewsTopItem (newsId, seriesId, position, note). Form admin con filtros (pais/genero/tag/productora/año), boton "generar candidatos" desde ratings, lista drag-to-reorder editable. Render publico con cards numeradas y nota de Flor por item.',
    type: 'feature',
    priority: 'MEDIUM',
  },

  // ------- Series / catalogo / IA -------
  {
    title:
      'SeriesInfoBlock generico: cards N labeladas en detalle de serie',
    description:
      'Pedido directo de Flor. Modelo SeriesInfoBlock { id, seriesId, label, body, sortOrder }. En admin: tabla con add/edit/reorder. En vista publica: solo renderiza blocks con contenido. Sirve para "Basado en", "Curiosidades", "Fun facts", "Polemica", "Premios" sin agregar campos al schema cada vez.',
    type: 'feature',
    priority: 'HIGH',
  },
  {
    title: 'Asistente IA en creacion de serie',
    description:
      'Reusar gemini.ts y el playlist-importer. Pegar URL/MyDramaList/YouTube → autocompletar titulo, año, pais, sinopsis (traducida), genero, tags sugeridas. Pegar texto crudo → sugerir tags + universo similar. Validacion de consistencia (año vs pais).',
    type: 'feature',
    priority: 'HIGH',
  },
  {
    title:
      'Recomendaciones "porque viste X, mira Y" en pagina de serie',
    description:
      'Calcular similitud por overlap de tags + genres + universe + country entre series vistas y candidatas. SQL puro, sin IA. Latencia <50ms, deterministico. v2 puede sumar Gemini con embeddings de sinopsis si la calidad se queda corta.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Sistema de recomendaciones admin curado',
    description:
      'Flor como admin gestiona recomendaciones. Cada usuario decide si las acepta en su config. Basado en generos, tags, o curado manual.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Detalle serie: rediseño bloque acciones inferior',
    description:
      'Compactar el bloque actual (solo compartir) a circular/compacto y sumar acciones de alto valor: suscribirse a notificaciones de la serie, marcar/seguir estado rapidamente, acceso directo a reseñas/comentarios. Suscripcion ya esta implementada.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Comparador de series 1v1',
    description:
      'Trama, casting, BSO, ratings en columnas lado a lado. Reusa ratings que ya existen. Engagement alto, diferenciacion vs MyDramaList.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Continuar viendo: persistir timestamp del ultimo episodio visto',
    description:
      'Volver a la app con friccion 0. Requiere localStorage o nueva columna lastWatchedAt en ViewStatus.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Heatmap publico de estrenos por mes/año',
    description:
      'Cuando se estrena cada serie BL. SEO + descubrimiento de series viejas.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Export del catalogo de usuario (Markdown/JSON)',
    description:
      'Pedido recurrente en comunidades. Bajo esfuerzo. Reusa /api/user/account/export que ya existe.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Busqueda avanzada multi-criterio combinada',
    description:
      'Combinar pais + genero + tag + año + rating minimo + estado de visualizacion en un solo form.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Import/export de datos para backup',
    description:
      'Backup completo de la DB exportable como JSON. Restauracion via comando admin.',
    type: 'feature',
    priority: 'LOW',
  },

  // ------- SEO -------
  {
    title: 'SEO Fase 1: robots por seccion + sitemaps + canonical',
    description:
      'Fortalecer src/app/robots.ts: permitir catalogo, series, novedades, noticias, sitios; bloquear admin y query params irrelevantes. Sitemap segmentado: sitemap-series.xml, sitemap-noticias.xml, sitemap-sitios.xml, sitemap-static.xml con lastmod real. Canonical consistente sin duplicados por query params.',
    type: 'feature',
    priority: 'HIGH',
  },
  {
    title: 'SEO Fase 2: schema.org + breadcrumbs + grafo interno',
    description:
      'JSON-LD por tipo: TVSeries/Movie, Review, Article, BreadcrumbList, WebSite. Bloques "Relacionados" en series/noticias/sitios. Breadcrumbs y hubs tematicos por tags, pais, idioma, genero.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'SEO Fase 3: llms.txt + endpoint /api/ai-map para agentes',
    description:
      'Publicar llms.txt y llms-full.txt con descripcion del proyecto, rutas clave, politicas de uso/citacion. Endpoint /api/ai-map con entidades, relaciones, URLs canonicas, fechas. Bloques "Facts" en series/noticias para reducir ambiguedad en respuestas de IA.',
    type: 'feature',
    priority: 'MEDIUM',
  },

  // ------- UX / housekeeping menor -------
  {
    title: 'Auditoria i18n admin idiomas',
    description:
      'Cobertura completa de labels/mensajes. Detectar cadenas hardcodeadas. Checklist: title/subtitle, tabla, acciones, modal, validaciones, toasts, estados vacios, errores API.',
    type: 'feature',
    priority: 'MEDIUM',
  },
  {
    title: 'Landing: quitar bloques relacionados a IA/asistente',
    description:
      'Bajar visibilidad de menciones a IA en landing publica.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Notificaciones por correo (opt-in desde config)',
    description:
      'Sistema opt-in. El sitio por default no envia ni consulta. Usuario activa en config. Notificacion cuando se resuelve un bug/feature al que se suscribio.',
    type: 'feature',
    priority: 'LOW',
  },
  {
    title: 'Limpiar imports no usados en FeedbackClient + BottomNav',
    description:
      'Lint warnings: Button, Pagination, Tooltip, Empty, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FeedbackType en admin/feedback FeedbackClient. signOut import en BottomNav.',
    type: 'bug',
    priority: 'LOW',
  },
  {
    title: 'Migrar OAuth client a proyecto Google Cloud propio',
    description:
      'Hoy el cliente OAuth de MundoBL vive en el proyecto AEGIS. Crear proyecto MundoBL en Google Cloud, nuevo OAuth client con todas las redirect URIs (.com.ar, .win, localhost), rotar GOOGLE_CLIENT_ID/SECRET en Vercel, mantener viejo cliente activo 24-48h como rollback, despues eliminar.',
    type: 'feature',
    priority: 'LOW',
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  let created = 0;
  let skipped = 0;

  for (const item of ITEMS) {
    const existing = await prisma.featureRequest.findFirst({
      where: { title: item.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`Skipped: "${item.title}" (already exists, id=${existing.id})`);
      skipped++;
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
    console.log(
      `Created: [${item.priority}] [${item.type}] "${item.title}" → id=${fr.id}`
    );
    created++;
  }

  const total = await prisma.featureRequest.count();
  console.log(
    `\nDone. Created: ${created}, Skipped: ${skipped}. Total in DB: ${total}`
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
