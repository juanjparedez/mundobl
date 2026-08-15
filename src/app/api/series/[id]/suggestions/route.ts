import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { formatPublicName } from '@/lib/user-display';
import { notifyAdminsOfSuggestion } from '@/lib/notifications';

const TYPE_LABELS: Record<string, string> = {
  DATO_FALTANTE: 'Dato faltante',
  CORRECCION_REPARTO: 'Corrección de reparto',
  DIAS_EMISION: 'Días de emisión',
  LINK_OFICIAL: 'Link de emisión oficial',
  OTRO: 'Otro aporte',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const isAdminOrMod =
      session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const where = isAdminOrMod
      ? { seriesId }
      : { seriesId, ...(currentUserId ? { userId: currentUserId } : {}) };

    const suggestions = await prisma.seriesSuggestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching series suggestions:', error);
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const resolvedParams = await params;
    const seriesId = parseInt(resolvedParams.id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { type, content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Debes detallar tu sugerencia o corrección.' },
        { status: 400 }
      );
    }

    const validTypes = [
      'DATO_FALTANTE',
      'CORRECCION_REPARTO',
      'DIAS_EMISION',
      'LINK_OFICIAL',
      'OTRO',
    ];
    const suggestionType = validTypes.includes(type) ? type : 'OTRO';

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { id: true, title: true },
    });

    if (!series) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { name: true, nickname: true },
    });

    const suggestion = await prisma.seriesSuggestion.create({
      data: {
        seriesId,
        userId: authResult.userId,
        type: suggestionType,
        content: content.trim(),
        status: 'PENDING',
      },
    });

    const authorName = formatPublicName(user);
    const excerpt = content.trim().slice(0, 80);
    const typeLabel = TYPE_LABELS[suggestionType] || 'Aporte';

    void notifyAdminsOfSuggestion({
      suggestionId: suggestion.id,
      seriesId: series.id,
      seriesTitle: series.title,
      authorName,
      suggestionType: typeLabel,
      excerpt,
    });

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json(
      { error: 'Error al enviar la sugerencia' },
      { status: 500 }
    );
  }
}
