import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// PUT /api/feature-requests/[id] — admin, actualizar status/priority
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const { status, priority } = body;

    const validStatuses = [
      'pendiente',
      'en_progreso',
      'completado',
      'descartado',
    ];
    const validPriorities = ['baja', 'media', 'alta'];

    const updateData: Record<string, string> = {};
    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status no válido' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (priority) {
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Prioridad no válida' },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }

    const updated = await prisma.featureRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { votes: true } },
        votes: { select: { userId: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating feature request:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la solicitud' },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-requests/[id] — admin
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;

    await prisma.featureRequest.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature request:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la solicitud' },
      { status: 500 }
    );
  }
}
