import { getCatalogSynopsis } from '@/lib/database';

export const dynamic = 'force-static';
export const revalidate = 21600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const data = await getCatalogSynopsis(Number(id));
  return data
    ? Response.json(data)
    : Response.json({ error: 'NOT_FOUND' }, { status: 404 });
}
