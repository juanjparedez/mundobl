import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

// GET /api/admin/announcements/[id]/recipients — ids de los destinatarios
// actuales (solo tiene sentido si audience = SPECIFIC_USERS). Se pide aparte
// del listado principal para no traer recipients de todos los anuncios en
// cada carga de /admin/anuncios (ahi solo viaja el _count).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  try {
    const rows = await prisma.announcementRecipient.findMany({
      where: { announcementId },
      select: { userId: true },
    });
    return NextResponse.json(rows.map((r) => r.userId));
  } catch (error) {
    console.error('Error fetching announcement recipients:', error);
    return NextResponse.json(
      { error: 'Error al obtener destinatarios' },
      { status: 500 }
    );
  }
}
