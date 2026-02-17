import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const results = await prisma.series.findMany({
      where: { basedOn: { not: null } },
      select: { basedOn: true },
      distinct: ['basedOn'],
      orderBy: { basedOn: 'asc' },
    });

    const values = results
      .map((r) => r.basedOn)
      .filter((v): v is string => v !== null);

    return NextResponse.json(values);
  } catch (error) {
    console.error('Error fetching basedOn values:', error);
    return NextResponse.json([], { status: 500 });
  }
}
