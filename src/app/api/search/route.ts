import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

const TAKE = 6;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({
      series: [],
      actors: [],
      directors: [],
      tags: [],
    });
  }

  const insensitive = { contains: query, mode: 'insensitive' as const };

  const [series, actors, directors, tags] = await Promise.all([
    prisma.series.findMany({
      where: {
        OR: [{ title: insensitive }, { originalTitle: insensitive }],
      },
      select: {
        id: true,
        title: true,
        year: true,
        type: true,
        imageUrl: true,
      },
      orderBy: { title: 'asc' },
      take: TAKE,
    }),
    prisma.actor.findMany({
      where: {
        OR: [{ name: insensitive }, { stageName: insensitive }],
      },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { name: 'asc' },
      take: TAKE,
    }),
    prisma.director.findMany({
      where: { name: insensitive },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { name: 'asc' },
      take: TAKE,
    }),
    prisma.tag.findMany({
      where: { name: insensitive },
      select: { id: true, name: true, category: true },
      orderBy: { name: 'asc' },
      take: TAKE,
    }),
  ]);

  return NextResponse.json({ series, actors, directors, tags });
}
