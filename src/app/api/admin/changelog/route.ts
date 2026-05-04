import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import fs from 'fs';
import path from 'path';

// GET /api/admin/changelog — lista todos los items (admin/mod)
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const items = await prisma.changelogItem.findMany({
      orderBy: [{ version: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching changelog items:', error);
    return NextResponse.json(
      { error: 'Error al obtener changelog' },
      { status: 500 }
    );
  }
}

// POST /api/admin/changelog — crear item
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { version, category, body: itemBody, sortOrder, importFromFile } = body as {
      version: string;
      category?: string;
      body: string;
      sortOrder?: number;
      importFromFile?: boolean;
    };

    // Importacion desde CHANGELOG.md
    if (importFromFile) {
      const filePath = path.join(process.cwd(), 'CHANGELOG.md');
      const content = fs.readFileSync(filePath, 'utf-8');

      interface ParsedEntry {
        version: string;
        category: string | null;
        body: string;
        sortOrder: number;
      }

      const items: ParsedEntry[] = [];
      let currentVersion: string | null = null;
      let currentCategory: string | null = null;
      let sortOrderCounter = 0;

      for (const line of content.split('\n')) {
        const versionMatch = line.match(/^## (.+)$/);
        if (versionMatch) {
          currentVersion = versionMatch[1].trim();
          currentCategory = null;
          sortOrderCounter = 0;
          continue;
        }
        const categoryMatch = line.match(/^### (.+)$/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1].trim();
          continue;
        }
        if (currentVersion && line.startsWith('- ')) {
          items.push({
            version: currentVersion,
            category: currentCategory,
            body: line.slice(2).trim(),
            sortOrder: sortOrderCounter++,
          });
        }
      }

      // Borrar items existentes e insertar los del archivo
      await prisma.changelogItem.deleteMany();
      await prisma.changelogItem.createMany({ data: items });

      return NextResponse.json({ imported: items.length }, { status: 201 });
    }

    if (!version?.trim() || !itemBody?.trim()) {
      return NextResponse.json(
        { error: 'version y body son requeridos' },
        { status: 400 }
      );
    }

    const item = await prisma.changelogItem.create({
      data: {
        version: version.trim(),
        category: category?.trim() || null,
        body: itemBody.trim(),
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating changelog item:', error);
    return NextResponse.json(
      { error: 'Error al crear item del changelog' },
      { status: 500 }
    );
  }
}
