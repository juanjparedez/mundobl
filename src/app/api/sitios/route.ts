import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const sites = await prisma.recommendedSite.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Error al obtener sitios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    if (!body.name?.trim() || !body.url?.trim()) {
      return NextResponse.json(
        { error: 'El nombre y la URL son requeridos' },
        { status: 400 }
      );
    }

    const site = await prisma.recommendedSite.create({
      data: {
        name: body.name.trim(),
        url: body.url.trim(),
        description: body.description?.trim() || null,
        category: body.category || null,
        language: body.language || null,
        imageUrl: body.imageUrl?.trim() || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error('Error al crear sitio:', error);
    return NextResponse.json(
      { error: 'Error al crear el sitio' },
      { status: 500 }
    );
  }
}
