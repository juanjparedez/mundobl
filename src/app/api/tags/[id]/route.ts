import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Eliminar un tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: 'Tag eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar tag:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el tag' },
      { status: 500 }
    );
  }
}
