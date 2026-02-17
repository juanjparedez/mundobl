import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const companies = await prisma.productionCompany.findMany({
      include: {
        _count: { select: { series: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching production companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener productoras' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la productora es requerido' },
        { status: 400 }
      );
    }

    const company = await prisma.productionCompany.create({
      data: {
        name: body.name.trim(),
        country: body.country || null,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear productora:', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe una productora con ese nombre' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la productora' },
      { status: 500 }
    );
  }
}
