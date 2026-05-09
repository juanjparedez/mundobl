import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { ImportarClient } from './ImportarClient';
import './importar.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Importar serie desde YouTube',
};

export default function ImportarSeriePage() {
  return (
    <AppLayout>
      <div className="importar-page">
        <ImportarClient />
      </div>
    </AppLayout>
  );
}
