import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/database';

interface ChangelogEntry {
  version: string;
  // Label legible del grupo (puede coincidir con `version` o ser distinto,
  // ej: "Pagina de contenido" en lugar de "137c773"). Si es null usar version.
  label?: string | null;
  items: string[];
}

function parseChangelogFile(): ChangelogEntry[] {
  try {
    const filePath = path.join(process.cwd(), 'CHANGELOG.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const entries: ChangelogEntry[] = [];
    let current: ChangelogEntry | null = null;

    for (const line of content.split('\n')) {
      const versionMatch = line.match(/^## (.+)$/);
      if (versionMatch) {
        if (current) entries.push(current);
        current = { version: versionMatch[1].trim(), items: [] };
        continue;
      }

      if (current && line.startsWith('- ')) {
        current.items.push(line.slice(2).trim());
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

  // Leer de DB; si está vacía, usar el archivo como fallback
  const dbItems = await prisma.changelogItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  let entries: ChangelogEntry[];

  if (dbItems.length > 0) {
    const versionMap = new Map<
      string,
      { label: string | null; items: string[] }
    >();
    for (const item of dbItems) {
      const existing = versionMap.get(item.version);
      if (existing) {
        existing.items.push(item.body);
        if (!existing.label && item.versionLabel) {
          existing.label = item.versionLabel;
        }
      } else {
        versionMap.set(item.version, {
          label: item.versionLabel ?? null,
          items: [item.body],
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
