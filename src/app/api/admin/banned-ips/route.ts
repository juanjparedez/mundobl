import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

// GET /api/admin/banned-ips — admin only
export async function GET() {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const bannedIps = await prisma.bannedIp.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bannedIps);
  } catch (error) {
    console.error('Error fetching banned IPs:', error);
    return NextResponse.json(
      { error: 'Error al obtener IPs bloqueadas' },
      { status: 500 }
    );
  }
}

// POST /api/admin/banned-ips — admin only, bloquear IP
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { ip, reason } = await request.json();

    if (!ip || typeof ip !== 'string') {
      return NextResponse.json({ error: 'IP es requerida' }, { status: 400 });
    }

    const bannedIp = await prisma.bannedIp.create({
      data: { ip: ip.trim(), reason: reason || null },
    });

    return NextResponse.json(bannedIp, { status: 201 });
  } catch (error) {
    console.error('Error banning IP:', error);
    return NextResponse.json(
      { error: 'Error al bloquear IP' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banned-ips?id=X — admin only, desbloquear IP
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const id = parseInt(request.nextUrl.searchParams.get('id') || '');
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.bannedIp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unbanning IP:', error);
    return NextResponse.json(
      { error: 'Error al desbloquear IP' },
      { status: 500 }
    );
  }
}
