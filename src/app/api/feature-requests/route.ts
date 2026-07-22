import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { checkFeatureRequestRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    // Sesion opcional: el board es publico. Si hay user logueado calculamos
    // `hasVoted` para el; NO exponemos la lista de quien voto (privacidad).
    const session = await auth();
    const currentUserId = session?.user?.id;

    const requests = await prisma.featureRequest.findMany({
      where: {
        type: { in: ['bug', 'feature', 'idea'] },
      },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true } },
        _count: { select: { votes: true, comments: true } },
        ...(currentUserId && {
          votes: { where: { userId: currentUserId }, select: { id: true } },
        }),
        images: { select: { id: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    type FRWithVotes = (typeof requests)[number] & {
      votes?: { id: number }[];
    };
    const enriched = (requests as FRWithVotes[]).map((r) => {
      const { votes, ...rest } = r;
      return { ...rest, hasVoted: !!votes && votes.length > 0 };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const rl = await checkFeatureRequestRateLimit(authResult.userId);
    if (!rl.ok) {
      return NextResponse.json(
        { error: rl.reason },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const { title, description, type, imageUrls } = body as {
      title: string;
      description?: string;
      type: string;
      imageUrls?: string[];
    };

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Título y tipo son requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['bug', 'feature', 'idea'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    const featureRequest = await prisma.featureRequest.create({
      data: {
        title,
        description: description || null,
        type,
        userId: authResult.userId,
        images:
          imageUrls && imageUrls.length > 0
            ? { create: imageUrls.map((url) => ({ url })) }
            : undefined,
      },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true } },
        _count: { select: { votes: true, comments: true } },
        images: { select: { id: true, url: true } },
      },
    });

    // Recien creada: el autor todavia no la voto.
    return NextResponse.json(
      { ...featureRequest, hasVoted: false },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { error: 'Error al crear la solicitud' },
      { status: 500 }
    );
  }
}
