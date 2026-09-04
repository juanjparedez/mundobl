import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';

function makeSlug(term: string, id: number): string {
  const normalized = term
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized || 'term'}-${id}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const id = Number.parseInt((await params).id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const data = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const status = data.status;
    if (status !== 'PENDING' && status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const suggestion = await prisma.glossarySuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: 'Sugerencia no encontrada' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (transaction) => {
      if (status === 'APPROVED') {
        await transaction.glossaryTerm.upsert({
          where: { slug: makeSlug(suggestion.term, suggestion.id) },
          create: {
            slug: makeSlug(suggestion.term, suggestion.id),
            term: suggestion.term,
            transliteration: suggestion.transliteration,
            country: suggestion.country,
            category: suggestion.category,
            meaning: suggestion.meaning,
            context: suggestion.context,
            publishedAt: new Date(),
            status: 'PUBLISHED',
          },
          update: {
            term: suggestion.term,
            transliteration: suggestion.transliteration,
            country: suggestion.country,
            category: suggestion.category,
            meaning: suggestion.meaning,
            context: suggestion.context,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      }

      return transaction.glossarySuggestion.update({
        where: { id },
        data: {
          status,
          adminNotes:
            typeof data.adminNotes === 'string' ? data.adminNotes.trim() || null : undefined,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[admin/glossary-suggestions PATCH]', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar la sugerencia.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) return authResult.response;

  const id = Number.parseInt((await params).id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  await prisma.glossarySuggestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
