import { ImportarClient } from './ImportarClient';
import './importar.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Importar serie desde YouTube',
};

export default async function ImportarSeriePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  // `?url=` lo manda el barrido de canal (/admin/series/barrido) con la
  // playlist ya elegida, para no obligar a copiar y pegar entre pantallas.
  const { url } = await searchParams;

  return (
    <>
      <div className="importar-page">
        <ImportarClient initialUrl={typeof url === 'string' ? url : ''} />
      </div>
    </>
  );
}
