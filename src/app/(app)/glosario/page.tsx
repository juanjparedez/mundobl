import type { Metadata } from 'next';
import { getPublishedGlossaryTerms } from '@/lib/database';
import { GlosarioClient } from './GlosarioClient';
import './glosario.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Glosario Cultural BL & GL | Términos, Honoríficos y Traducción',
  description:
    'Guía cultural de honoríficos tailandeses (P’, N’, Khun, Hia), términos románticos (Faen, Ti-lak) y conceptos clave del universo BL y GL.',
  alternates: { canonical: '/glosario' },
};

export default async function GlosarioPage() {
  const terms = await getPublishedGlossaryTerms();

  return (
    <>
      <GlosarioClient terms={terms} />
    </>
  );
}
