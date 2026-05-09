import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = (await request.json()) as { nickname?: unknown };

    const data: { nickname?: string | null } = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nickname')) {
      const raw = body.nickname;
      if (raw === null) {
        data.nickname = null;
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
          data.nickname = null;
        } else if (trimmed.length > 40) {
          return NextResponse.json(
            { error: 'El nickname no puede tener más de 40 caracteres' },
            { status: 422 }
          );
        } else if (!/^[\p{L}\p{N}_.\- ]+$/u.test(trimmed)) {
          return NextResponse.json(
            {
              error:
                'El nickname solo puede tener letras, numeros, espacios, puntos, guiones y guiones bajos',
            },
            { status: 422 }
          );
        } else {
          data.nickname = trimmed;
        }
      } else {
        return NextResponse.json(
          { error: 'nickname debe ser string o null' },
          { status: 400 }
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: authResult.userId },
      data,
      select: { id: true, name: true, nickname: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
