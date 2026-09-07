import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { EXCLUDE_PLACEHOLDER_ACTOR } from '@/lib/placeholder-actor';

const TAKE = 6;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({
      series: [],
      actors: [],
      directors: [],
      tags: [],
      glossary: [],
    });
  }

  const insensitive = { contains: query, mode: 'insensitive' as const };

  const [series, actors, directors, tags, glossary] = await Promise.all([
    prisma.series.findMany({
      where: {
        origin: 'CURATED',
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
        AND: [
          EXCLUDE_PLACEHOLDER_ACTOR,
          { OR: [{ name: insensitive }, { stageName: insensitive }] },
        ],
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
    // Glosario cultural: se busca tambien por transliteracion y significado
    // porque el usuario rara vez sabe como se escribe el termino — llega
    // buscando "hermano mayor" o "phi", no "P'".
    prisma.glossaryTerm.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { term: insensitive },
          { transliteration: insensitive },
          { meaning: insensitive },
        ],
      },
      select: {
        id: true,
        slug: true,
        term: true,
        transliteration: true,
        category: true,
      },
      orderBy: { term: 'asc' },
      take: TAKE,
    }),
  ]);

  return NextResponse.json({ series, actors, directors, tags, glossary });
}
