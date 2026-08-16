import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { GlosarioClient } from './GlosarioClient';
import './glosario.css';

export const metadata: Metadata = {
  title: 'Glosario Cultural BL & GL | Términos, Honoríficos y Traducción',
  description:
    'Guía cultural de honoríficos tailandeses (P’, N’, Khun, Hia), términos románticos (Faen, Ti-lak) y conceptos clave del universo BL y GL.',
  alternates: { canonical: '/glosario' },
};

export default function GlosarioPage() {
  return (
    <AppLayout>
      <GlosarioClient />
    </AppLayout>
  );
}
