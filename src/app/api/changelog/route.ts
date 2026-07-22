import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/database';

// Cada item del changelog tiene texto + categoria opcional ("Features",
// "Fixes", "Performance", "SEO", "Seguridad"...). La categoria viene de
// los `### CategoryName` headers en CHANGELOG.md o del campo `category`
// del modelo `ChangelogItem` en DB.
interface ChangelogItemEntry {
  body: string;
  category: string | null;
}

interface ChangelogEntry {
  version: string;
  // Label legible del grupo (puede coincidir con `version` o ser distinto,
  // ej: "Pagina de contenido" en lugar de "137c773"). Si es null usar version.
  label?: string | null;
  items: ChangelogItemEntry[];
}

function parseChangelogFile(): ChangelogEntry[] {
  try {
    const filePath = path.join(process.cwd(), 'CHANGELOG.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: ChangelogEntry[] = [];
    let current: ChangelogEntry | null = null;
    // Categoria activa para items que sigan a un `### CategoryName` header.
    let currentCategory: string | null = null;

    for (const line of content.split('\n')) {
      const versionMatch = line.match(/^## (.+)$/);
      if (versionMatch) {
        if (current) entries.push(current);
        current = { version: versionMatch[1].trim(), items: [] };
        currentCategory = null; // resetear categoria entre versiones
        continue;
      }

      const categoryMatch = line.match(/^### (.+)$/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        continue;
      }

      if (current && line.startsWith('- ')) {
        current.items.push({
          body: line.slice(2).trim(),
          category: currentCategory,
        });
      }
    }

    if (current) entries.push(current);
    return entries;
  } catch {
    return [];
  }
}

function getBuildId(): string {
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    return fs.readFileSync(buildIdPath, 'utf-8').trim();
  } catch {
    return 'unknown';
  }
}

// Fallback: reconstruye el changelog desde la DB (`ChangelogItem`, editable
// desde /admin/changelog). Solo se usa si CHANGELOG.md esta vacio/ausente.
async function parseChangelogFromDb(): Promise<ChangelogEntry[]> {
  const dbItems = await prisma.changelogItem.findMany();
  if (dbItems.length === 0) return [];

  {
    // Agrupar por version. Importante: el orden de las VERSIONES se
    // calcula por su recencia real (max createdAt de sus items), NO por
    // el sortOrder global — antes "2026-04" (sortOrder 1-33) salia antes
    // que "2026-05-12" (sortOrder 0-9) y el changelog mostraba lo viejo
    // primero. Dentro de cada version, los items van por sortOrder desc.
    const versionMap = new Map<
      string,
      {
        label: string | null;
        items: { body: string; category: string | null; sort: number }[];
        recency: number;
      }
    >();
    for (const item of dbItems) {
      const ts = item.createdAt.getTime();
      const existing = versionMap.get(item.version);
      if (existing) {
        existing.items.push({
          body: item.body,
          category: item.category ?? null,
          sort: item.sortOrder,
        });
        if (!existing.label && item.versionLabel) {
          existing.label = item.versionLabel;
        }
        if (ts > existing.recency) existing.recency = ts;
      } else {
        versionMap.set(item.version, {
          label: item.versionLabel ?? null,
          items: [
            {
              body: item.body,
              category: item.category ?? null,
              sort: item.sortOrder,
            },
          ],
          recency: ts,
        });
      }
    }
    return Array.from(versionMap.entries())
      .sort((a, b) => b[1].recency - a[1].recency)
      .map(([version, { label, items }]) => ({
        version,
        label,
        items: items
          .sort((x, y) => y.sort - x.sort)
          .map(({ body, category }) => ({ body, category })),
      }));
  }
}

export async function GET() {
  const buildId = getBuildId();

  // CHANGELOG.md es la fuente de verdad: se lee del repo en cada deploy, asi
  // que actualizar el archivo (y deployar) alcanza para publicar novedades.
  // La DB queda como fallback solo si el archivo esta vacio o ausente.
  let entries = parseChangelogFile();
  if (entries.length === 0) {
    entries = await parseChangelogFromDb();
  }

  return NextResponse.json({ buildId, entries });
}
