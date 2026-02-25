import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import {
  getAccessLogs,
  cleanOldLogs,
  cleanScannerLogs,
} from '@/lib/access-log';

// GET /api/admin/logs — admin only, retorna logs con filtros
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      action: searchParams.get('action') || undefined,
      userId: searchParams.get('userId') || undefined,
      ip: searchParams.get('ip') || undefined,
      path: searchParams.get('path') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    };

    const result = await getAccessLogs(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/logs — admin only, limpieza de logs viejos
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    // DELETE /api/admin/logs?type=scanners — limpiar logs de scanners
    if (type === 'scanners') {
      const deleted = await cleanScannerLogs();
      return NextResponse.json({
        deleted,
        message: `${deleted} logs de scanners eliminados`,
      });
    }

    // DELETE /api/admin/logs?days=90 — limpiar logs viejos
    const days = parseInt(searchParams.get('days') || '90');
    const deleted = await cleanOldLogs(days);
    return NextResponse.json({
      deleted,
      message: `${deleted} logs eliminados`,
    });
  } catch (error) {
    console.error('Error cleaning logs:', error);
    return NextResponse.json(
      { error: 'Error al limpiar logs' },
      { status: 500 }
    );
  }
}
