import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { logAction } from '@/lib/access-log';
import type { Prisma } from '@/generated/prisma';

// GET /api/admin/announcements — lista todos (admin)
export async function GET() {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  try {
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncios' },
      { status: 500 }
    );
  }
}

interface AnnouncementInput {
  title?: string;
  body?: string;
  tone?: string;
  audience?: string;
  pages?: string[];
  dismissible?: boolean;
  linkUrl?: string | null;
  linkLabel?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

// POST /api/admin/announcements — crear
export async function POST(request: NextRequest) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  try {
    const body = (await request.json()) as AnnouncementInput;

    if (!body.title?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: 'title y body son requeridos' },
        { status: 400 }
      );
    }

    const data: Prisma.AnnouncementCreateInput = {
      title: body.title.trim(),
      body: body.body.trim(),
      tone: (body.tone as Prisma.AnnouncementCreateInput['tone']) ?? 'INFO',
      audience:
        (body.audience as Prisma.AnnouncementCreateInput['audience']) ??
        'EVERYONE',
      pages: Array.isArray(body.pages) ? body.pages : [],
      dismissible: body.dismissible ?? true,
      linkUrl: body.linkUrl?.trim() || null,
      linkLabel: body.linkLabel?.trim() || null,
      isActive: body.isActive ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      createdBy: { connect: { id: authResult.userId } },
    };

    const created = await prisma.announcement.create({ data });

    logAction('CREATE', request.nextUrl.pathname, 'POST', authResult.userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Error al crear el anuncio' },
      { status: 500 }
    );
  }
}
