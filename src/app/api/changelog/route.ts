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

export async function GET() {
  const buildId = getBuildId();

  // Leer de DB; si está vacía, usar el archivo como fallback.
  // Orden: novedades mas recientes primero (sortOrder/createdAt desc).
  const dbItems = await prisma.changelogItem.findMany({
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
  });

  let entries: ChangelogEntry[];

  if (dbItems.length > 0) {
    const versionMap = new Map<
      string,
      { label: string | null; items: ChangelogItemEntry[] }
    >();
    for (const item of dbItems) {
      const existing = versionMap.get(item.version);
      if (existing) {
        existing.items.push({ body: item.body, category: item.category ?? null });
        if (!existing.label && item.versionLabel) {
          existing.label = item.versionLabel;
        }
      } else {
        versionMap.set(item.version, {
          label: item.versionLabel ?? null,
          items: [{ body: item.body, category: item.category ?? null }],
        });
      }
    }
    entries = Array.from(versionMap.entries()).map(
      ([version, { label, items }]) => ({ version, label, items })
    );
  } else {
    entries = parseChangelogFile();
  }

  return NextResponse.json({ buildId, entries });
}
