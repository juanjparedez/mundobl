import { getWritersIndex } from '@/lib/database';
import { loadLocaleMessages } from '@/i18n/messages';
import { isIndexablePerson } from '@/lib/person-completeness';
import { PeopleIndexShell } from '../actores/PeopleIndexShell';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { writerProfile } = await loadLocaleMessages('es');
  return {
    title: writerProfile.indexTitle,
    description: writerProfile.indexDescription,
    alternates: { canonical: '/guionistas' },
  };
}
export default async function WritersPage() {
  const writers = await getWritersIndex();
  return (
    <PeopleIndexShell
      titleKey="writerProfile.indexTitle"
      subtitleKey="writerProfile.indexDescription"
      countKey="peopleIndex.creditsCount"
      current="/guionistas"
      nationalities={[
        ...new Set(
          writers
            .map((writer) => writer.nationality)
            .filter((value): value is string => !!value)
        ),
      ].sort()}
      items={writers.map((writer) => ({
        id: writer.id,
        href: `/guionistas/${writer.id}`,
        name: writer.name,
        subtitle: writer.nationality,
        nationality: writer.nationality,
        searchTerms: writer.aliases,
        imageUrl: writer.imageUrl,
        count: writer.creditCount,
        indexable: isIndexablePerson(writer),
      }))}
    />
  );
}
