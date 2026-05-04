import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

const STATUS_VALUES = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
] as const;
type StatusValue = (typeof STATUS_VALUES)[number];

// GET /api/admin/news — lista noticias con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    const search = searchParams.get('q')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
      200
    );

    const where: Prisma.NewsWhereInput = {};
    if (statusParam && STATUS_VALUES.includes(statusParam as StatusValue)) {
      where.status = statusParam as StatusValue;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { sourceName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          relatedSeries: { select: { id: true, title: true } },
          approvedBy: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
      prisma.news.count({ where }),
    ]);

    return NextResponse.json({ news, total, page, pageSize });
  } catch (error) {
    console.error('[admin/news] GET error:', error);
    return NextResponse.json(
      { error: 'Error al obtener noticias' },
      { status: 500 }
    );
  }
}

// POST /api/admin/news — crear noticia
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as {
      title?: string;
      summary?: string;
      originalUrl?: string;
      sourceName?: string;
      sourceLogo?: string;
      imageUrl?: string;
      publishedAt?: string;
      status?: string;
      aiGenerated?: boolean;
      florNotes?: string;
      relatedSeriesId?: number;
      tagIds?: number[];
    };

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'title es requerido' },
        { status: 400 }
      );
    }
    if (!body.summary?.trim()) {
      return NextResponse.json(
        { error: 'summary es requerido' },
        { status: 400 }
      );
    }
    if (!body.originalUrl?.trim() || !body.sourceName?.trim()) {
      return NextResponse.json(
        { error: 'originalUrl y sourceName son requeridos' },
        { status: 400 }
      );
    }

    const statusToSet: StatusValue =
      body.status && STATUS_VALUES.includes(body.status as StatusValue)
        ? (body.status as StatusValue)
        : 'DRAFT';

    // Guardrail: no se puede publicar sin fuente
    if (
      statusToSet === 'PUBLISHED' &&
      (!body.originalUrl?.trim() || !body.sourceName?.trim())
    ) {
      return NextResponse.json(
        { error: 'No se puede publicar sin originalUrl y sourceName' },
        { status: 422 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title: body.title.trim(),
        summary: body.summary.trim(),
        originalUrl: body.originalUrl.trim(),
        sourceName: body.sourceName.trim(),
        sourceLogo: body.sourceLogo?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        status: statusToSet,
        aiGenerated: body.aiGenerated ?? true,
        florNotes: body.florNotes?.trim() || null,
        relatedSeriesId: body.relatedSeriesId ?? null,
        tags: body.tagIds?.length
          ? {
              create: body.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        relatedSeries: { select: { id: true, title: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ news }, { status: 201 });
  } catch (error) {
    console.error('[admin/news] POST error:', error);
    return NextResponse.json(
      { error: 'Error al crear noticia' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/news?id=X — actualizar campos / cambiar status
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = (await request.json()) as {
      title?: string;
      summary?: string;
      originalUrl?: string;
      sourceName?: string;
      sourceLogo?: string;
      imageUrl?: string;
      publishedAt?: string | null;
      status?: string;
      aiGenerated?: boolean;
      florNotes?: string;
      relatedSeriesId?: number | null;
      tagIds?: number[];
    };

    // Guardrail: no publicar sin fuente
    if (body.status === 'PUBLISHED') {
      const current = await prisma.news.findUnique({
        where: { id },
        select: { originalUrl: true, sourceName: true },
      });
      const effectiveUrl = body.originalUrl?.trim() ?? current?.originalUrl;
      const effectiveName = body.sourceName?.trim() ?? current?.sourceName;
      if (!effectiveUrl || !effectiveName) {
        return NextResponse.json(
          { error: 'No se puede publicar sin originalUrl y sourceName' },
          { status: 422 }
        );
      }
    }

    const updateData: Prisma.NewsUpdateInput = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.summary !== undefined) updateData.summary = body.summary.trim();
    if (body.originalUrl !== undefined)
      updateData.originalUrl = body.originalUrl.trim();
    if (body.sourceName !== undefined)
      updateData.sourceName = body.sourceName.trim();
    if (body.sourceLogo !== undefined)
      updateData.sourceLogo = body.sourceLogo?.trim() || null;
    if (body.imageUrl !== undefined)
      updateData.imageUrl = body.imageUrl?.trim() || null;
    if (body.publishedAt !== undefined)
      updateData.publishedAt = body.publishedAt
        ? new Date(body.publishedAt)
        : null;
    if (body.aiGenerated !== undefined)
      updateData.aiGenerated = body.aiGenerated;
    if (body.florNotes !== undefined)
      updateData.florNotes = body.florNotes?.trim() || null;
    if (body.relatedSeriesId !== undefined)
      updateData.relatedSeries = body.relatedSeriesId
        ? { connect: { id: body.relatedSeriesId } }
        : { disconnect: true };
    if (body.status && STATUS_VALUES.includes(body.status as StatusValue)) {
      updateData.status = body.status as StatusValue;
    }

    const news = await prisma.$transaction(async (tx) => {
      if (body.tagIds !== undefined) {
        await tx.newsTag.deleteMany({ where: { newsId: id } });
        if (body.tagIds.length > 0) {
          await tx.newsTag.createMany({
            data: body.tagIds.map((tagId) => ({ newsId: id, tagId })),
            skipDuplicates: true,
          });
        }
      }
      return tx.news.update({
        where: { id },
        data: updateData,
        include: {
          relatedSeries: { select: { id: true, title: true } },
          approvedBy: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      });
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error('[admin/news] PATCH error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar noticia' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/news?id=X
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '', 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.news.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/news] DELETE error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar noticia' },
      { status: 500 }
    );
  }
}
