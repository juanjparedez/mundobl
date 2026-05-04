import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/database';

interface ChangelogEntry {
  version: string;
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
    const versionMap = new Map<string, string[]>();
    for (const item of dbItems) {
      if (!versionMap.has(item.version)) {
        versionMap.set(item.version, []);
      }
      versionMap.get(item.version)!.push(item.body);
    }
    entries = Array.from(versionMap.entries()).map(([version, items]) => ({
      version,
      items,
    }));
  } else {
    entries = parseChangelogFile();
  }

  return NextResponse.json({ buildId, entries });
}
