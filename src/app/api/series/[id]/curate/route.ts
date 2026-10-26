import { TrackingPreservationError } from '@/lib/tracking-preservation';
import { loadLocaleMessages } from '@/i18n/messages';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import {
  loadSeriesForSave,
  saveSeriesFromForm,
  SeriesEditConflictError,
  parseExpectedEditVersion,
  type SeriesFormBody,
} from '@/lib/series-save';
import { curationSnapshot, mergeCuration } from '@/lib/series-curation';
import {
  CURATION_FIELDS,
  type CurationField,
} from '@/lib/series-curation-fields';
import { revalidateSeries, revalidateUniverse } from '@/lib/revalidate-series';
import { extractVideoId, type Platform } from '@/lib/embed-helpers';
import type { PendingContentItem } from '@/components/admin/SeriesContentManager/SeriesContentManager';
import type { PendingInfoBlock } from '@/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) return auth.response;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json({}, { status: 400 });
  const current = await loadSeriesForSave(prisma, id);
  if (!current || current.origin !== 'CURATED')
    return NextResponse.json({}, { status: 404 });
  const snapshot = curationSnapshot(current);
  return NextResponse.json({
    editVersion: current.editVersion,
    values: Object.fromEntries(
      Object.keys(CURATION_FIELDS).map((key) => [
        key,
        snapshot[key as CurationField] ?? null,
      ])
    ),
  });
}

export async function POST(request: NextRequest, { params }: Context) {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) return auth.response;
  try {
    const id = Number((await params).id);
    const input = (await request.json()) as {
      values: SeriesFormBody;
      fields: CurationField[];
      contentItems?: PendingContentItem[];
      infoBlocks?: PendingInfoBlock[];
    };
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !input.values ||
      parseExpectedEditVersion(input.values.editVersion) === null ||
      !Array.isArray(input.fields) ||
      input.fields.some((field) => !Object.hasOwn(CURATION_FIELDS, field))
    ) {
      return NextResponse.json({ error: 'Invalid curation' }, { status: 400 });
    }
    const current = await loadSeriesForSave(prisma, id);
    if (!current || current.origin !== 'CURATED')
      return NextResponse.json({}, { status: 404 });
    if (current.editVersion !== input.values.editVersion)
      throw new SeriesEditConflictError();
    const body = mergeCuration(current, input.values, input.fields);
    if (typeof body.title !== 'string' || !body.title.trim())
      return NextResponse.json({}, { status: 400 });
    const contentItems = input.contentItems ?? [];
    const infoBlocks = input.infoBlocks ?? [];
    if (
      !Array.isArray(contentItems) ||
      !Array.isArray(infoBlocks) ||
      contentItems.some(
        (item) => !item?.title?.trim() || !item?.url?.trim() || !item?.platform
      ) ||
      infoBlocks.some((block) => !block?.label?.trim() || !block?.body?.trim())
    ) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    const outcome = await saveSeriesFromForm(
      id,
      body,
      { url: body.imageUrl ?? null, thumbUrl: body.imageThumbUrl },
      auth.userId,
      async (tx) => {
        for (const item of contentItems) {
          await tx.embeddableContent.create({
            data: {
              seriesId: id,
              title: item.title.trim(),
              url: item.url.trim(),
              platform: item.platform,
              videoId: extractVideoId(
                item.platform as Platform,
                item.url.trim()
              ),
              description: item.description || null,
              category: item.category || 'other',
              thumbnailUrl: item.thumbnailUrl || null,
              channelName: item.channelName || null,
              official: item.official ?? true,
              featured: item.featured ?? false,
              sortOrder: item.sortOrder ?? 0,
            },
          });
        }
        const last = await tx.seriesInfoBlock.aggregate({
          where: { seriesId: id },
          _max: { sortOrder: true },
        });
        for (const [index, block] of infoBlocks.entries()) {
          await tx.seriesInfoBlock.create({
            data: {
              seriesId: id,
              label: block.label.trim(),
              body: block.body.trim(),
              sortOrder: (last._max.sortOrder ?? -1) + 1 + index,
            },
          });
        }
      }
    );
    if (!outcome) return NextResponse.json({}, { status: 404 });
    revalidateSeries(outcome.updated);

    const universesToRevalidate = new Set<number>();
    if (outcome.previousUniverseId) {
      universesToRevalidate.add(outcome.previousUniverseId);
    }
    if (outcome.updated.universeId) {
      universesToRevalidate.add(outcome.updated.universeId);
    }
    for (const uId of universesToRevalidate) {
      await revalidateUniverse(uId);
    }

    return NextResponse.json(outcome.updated);
  } catch (error) {
    if (error instanceof TrackingPreservationError)
      return NextResponse.json(
        {
          error: (await loadLocaleMessages('es')).editorial.preserveTracking,
          code: 'TRACKING_PRESERVATION_REQUIRED',
        },
        { status: 409 }
      );
    if (error instanceof SeriesEditConflictError)
      return NextResponse.json({ code: 'EDIT_CONFLICT' }, { status: 409 });
    console.error('Error curating existing series:', error);
    return NextResponse.json(
      { error: 'Failed to curate series' },
      { status: 500 }
    );
  }
}
