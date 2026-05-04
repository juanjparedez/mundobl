import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

// PATCH /api/admin/changelog/[id] — editar item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await request.json();
    const { version, category, body: itemBody, sortOrder } = body as {
      version?: string;
      category?: string | null;
      body?: string;
      sortOrder?: number;
    };

    const item = await prisma.changelogItem.update({
      where: { id: itemId },
      data: {
        ...(version !== undefined && { version: version.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(itemBody !== undefined && { body: itemBody.trim() }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating changelog item:', error);
    return NextResponse.json(
      { error: 'Error al actualizar item del changelog' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/changelog/[id] — eliminar item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.changelogItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting changelog item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar item del changelog' },
      { status: 500 }
    );
  }
}
