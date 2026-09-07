import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { notifyUser } from '@/lib/notifications';

function makeSlug(term: string, id: number): string {
  const normalized = term
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized || 'term'}-${id}`;
}

// Los tags llegan del Select del panel: ids del catalogo compartido. Se
// filtra a enteros validos para no romper la transaccion con basura del
// cliente. `undefined` (campo ausente) significa "no tocar los tags";
// `[]` significa "sacarle todos" — son casos distintos a proposito.
function parseTagIds(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = raw
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  return Array.from(new Set(ids));
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
    const data =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const status = data.status;
    if (
      status !== 'PENDING' &&
      status !== 'APPROVED' &&
      status !== 'REJECTED'
    ) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const suggestion = await prisma.glossarySuggestion.findUnique({
      where: { id },
    });
    if (!suggestion) {
      return NextResponse.json(
        { error: 'Sugerencia no encontrada' },
        { status: 404 }
      );
    }

    const tagIds = parseTagIds(data.tagIds);
    const slug = makeSlug(suggestion.term, suggestion.id);

    const updated = await prisma.$transaction(async (transaction) => {
      if (status === 'APPROVED') {
        const term = await transaction.glossaryTerm.upsert({
          where: { slug },
          create: {
            slug,
            term: suggestion.term,
            transliteration: suggestion.transliteration,
            country: suggestion.country,
            category: suggestion.category,
            meaning: suggestion.meaning,
            context: suggestion.context,
            commonMistake: suggestion.commonMistake,
            examples: suggestion.examples,
            sourceName: suggestion.sourceName,
            sourceUrl: suggestion.sourceUrl,
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
            commonMistake: suggestion.commonMistake,
            examples: suggestion.examples,
            sourceName: suggestion.sourceName,
            sourceUrl: suggestion.sourceUrl,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        // Sincroniza las etiquetas elegidas por el moderador al aprobar.
        // Se borra y recrea en vez de hacer diff: son pocas filas y asi
        // el estado final es exactamente lo que quedo marcado en el panel.
        if (tagIds) {
          await transaction.glossaryTermTag.deleteMany({
            where: { glossaryTermId: term.id },
          });
          if (tagIds.length > 0) {
            await transaction.glossaryTermTag.createMany({
              data: tagIds.map((tagId) => ({
                glossaryTermId: term.id,
                tagId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return transaction.glossarySuggestion.update({
        where: { id },
        data: {
          status,
          adminNotes:
            typeof data.adminNotes === 'string'
              ? data.adminNotes.trim() || null
              : undefined,
        },
      });
    });

    // Aviso al autor: su aporte no puede quedar en el limbo. Solo cuando el
    // estado efectivamente cambio, y nunca al moderador que se aprueba a si
    // mismo. Falla en silencio para no tumbar la moderacion.
    if (
      suggestion.userId &&
      status !== suggestion.status &&
      status !== 'PENDING' &&
      suggestion.userId !== authResult.userId
    ) {
      const approved = status === 'APPROVED';
      await notifyUser({
        userId: suggestion.userId,
        type: 'glossary_suggestion_status',
        title: approved
          ? `Publicamos tu termino: "${suggestion.term}"`
          : `Revisamos tu propuesta: "${suggestion.term}"`,
        body: approved
          ? 'Ya esta en el glosario cultural, con tu aporte adentro. Gracias.'
          : updated.adminNotes ||
            'Por ahora no la sumamos al glosario. Podes proponerla de nuevo con mas contexto.',
        linkPath: approved
          ? `/glosario?term=${encodeURIComponent(slug)}`
          : '/glosario?view=contribute',
        refType: 'glossary_suggestion',
        refId: id,
      }).catch(() => {
        /* never block the main op */
      });
    }

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
