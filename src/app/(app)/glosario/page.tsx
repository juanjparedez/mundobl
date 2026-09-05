import type { Metadata } from 'next';
import { getPublishedGlossaryTerms, prisma } from '@/lib/database';
import { GlosarioClient } from './GlosarioClient';
import './glosario.css';

// Recursos externos recomendados para la tab "Resources" — reusa
// RecommendedSite (el mismo modelo de /sitios, gestionado desde
// /admin/sitios) filtrado por categoria, en vez de mantener una lista
// aparte. Evita duplicar un sistema de moderacion/admin para esto.
const RESOURCES_CATEGORY = 'glosario';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Glosario Cultural BL & GL | Términos, Honoríficos y Traducción',
  description:
    'Guía cultural de honoríficos tailandeses (P’, N’, Khun, Hia), términos románticos (Faen, Ti-lak) y conceptos clave del universo BL y GL.',
  alternates: { canonical: '/glosario' },
};

export default async function GlosarioPage() {
  const [rawTerms, resources] = await Promise.all([
    getPublishedGlossaryTerms(),
    prisma.recommendedSite.findMany({
      where: { category: RESOURCES_CATEGORY },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, url: true, description: true, language: true },
    }),
  ]);
  const terms = rawTerms.map(({ tags, ...term }) => ({
    ...term,
    tagNames: tags.map((t) => t.tag.name),
  }));

  return (
    <>
      <GlosarioClient terms={terms} resources={resources} />
    </>
  );
}
