import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { FeedbackClient } from './FeedbackClient/FeedbackClient';

export const metadata: Metadata = {
  title: 'Feedback y Changelog',
  description:
    'Envía tu feedback y consulta los últimos cambios y mejoras de MundoBL.',
  alternates: {
    canonical: '/feedback',
  },
};

export default function FeedbackPage() {
  return (
    <AppLayout>
      <FeedbackClient />
    </AppLayout>
  );
}
