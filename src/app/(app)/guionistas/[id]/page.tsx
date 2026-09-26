import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getWriterById } from '@/lib/database';
import { loadLocaleMessages } from '@/i18n/messages';
import { isIndexablePerson } from '@/lib/person-completeness';
import { WriterProfile } from './WriterProfile/WriterProfile';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
const readWriter = cache(async (raw: string) => {
  if (!/^[1-9]\d*$/.test(raw)) notFound();
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id > 2147483647) notFound();
  const writer = await getWriterById(id);
  if (!writer) notFound();
  return writer;
});
export async function generateMetadata({ params }: Props) {
  const writer = await readWriter((await params).id);
  const { writerProfile } = await loadLocaleMessages('es');
  return {
    title: `${writer.name} · ${writerProfile.role}`,
    description: writer.biography?.slice(0, 160),
    alternates: { canonical: `/guionistas/${writer.id}` },
    robots: isIndexablePerson({ ...writer, creditCount: writer.series.length })
      ? undefined
      : { index: false, follow: true },
  };
}
export default async function WriterPage({ params }: Props) {
  return <WriterProfile writer={await readWriter((await params).id)} />;
}
