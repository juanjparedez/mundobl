import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChangelogEntry {
  version: string;
  items: string[];
}

function parseChangelog(): ChangelogEntry[] {
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
  const entries = parseChangelog();
  const buildId = getBuildId();

  return NextResponse.json({ buildId, entries });
}
