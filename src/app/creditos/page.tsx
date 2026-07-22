import type { Metadata } from 'next';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { prisma } from '@/lib/database';
import { Card, Tag } from 'antd';
import { YoutubeOutlined, LinkOutlined } from '@/lib/client-icons';
import './creditos.css';

export const metadata: Metadata = {
  title: 'Créditos y Fuentes',
  description:
    'Canales y plataformas oficiales desde donde reproducimos contenido legalmente embebido en MundoBL.',
  alternates: { canonical: '/creditos' },
};

export const dynamic = 'force-dynamic';

interface ChannelEntry {
  name: string;
  url: string | null;
  platform: string;
  seriesCount: number;
  episodesCount: number;
  seriesIds: number[];
}

async function getChannels(): Promise<ChannelEntry[]> {
  const episodes = await prisma.episode.findMany({
    where: { embedUrl: { not: null }, embedChannelName: { not: null } },
    select: {
      embedChannelName: true,
      embedChannelUrl: true,
      embedPlatform: true,
      season: { select: { seriesId: true } },
    },
  });

  const map = new Map<string, ChannelEntry>();
  for (const ep of episodes) {
    const key = `${ep.embedPlatform}::${ep.embedChannelName}`;
    if (!map.has(key)) {
      map.set(key, {
        name: ep.embedChannelName!,
        url: ep.embedChannelUrl,
        platform: ep.embedPlatform || 'YouTube',
        seriesCount: 0,
        episodesCount: 0,
        seriesIds: [],
      });
    }
    const entry = map.get(key)!;
    entry.episodesCount += 1;
    if (!entry.seriesIds.includes(ep.season.seriesId)) {
      entry.seriesIds.push(ep.season.seriesId);
      entry.seriesCount += 1;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.episodesCount - a.episodesCount
  );
}

const CURATED_CHANNELS: Array<{
  name: string;
  url: string;
  description: string;
  country: string;
}> = [
  {
    name: 'GMMTV',
    url: 'https://www.youtube.com/@GMMTVOFFICIAL',
    description:
      'La productora más grande de series BL en Tailandia. Sube series completas y oficialmente en su canal.',
    country: 'Tailandia',
  },
  {
    name: 'Be On Cloud',
    url: 'https://www.youtube.com/@BeOnCloudOfficial',
    description:
      'Productora de KinnPorsche, Man Suang y otras producciones BL.',
    country: 'Tailandia',
  },
  {
    name: 'Idol Factory',
    url: 'https://www.youtube.com/@idolfactoryofficial',
    description: 'Estudio detrás de varias series BL tailandesas populares.',
    country: 'Tailandia',
  },
  {
    name: 'Dee Hup House',
    url: 'https://www.youtube.com/@deehuphouse',
    description: 'Productora con BL tailandés legal y gratuito.',
    country: 'Tailandia',
  },
  {
    name: 'JustUp',
    url: 'https://www.youtube.com/@JustUpChannel',
    description: 'Canal oficial con series BL completas.',
    country: 'Tailandia',
  },
  {
    name: 'Star Hunter Entertainment',
    url: 'https://www.youtube.com/@StarHunterEntertainment',
    description: 'Productora de BL tailandés con catálogo en YouTube.',
    country: 'Tailandia',
  },
  {
    name: 'IdeaFirst Company',
    url: 'https://www.youtube.com/@IdeaFirstCompany',
    description: 'Productora filipina de varios títulos BL pinoy.',
    country: 'Filipinas',
  },
];

export default async function CreditosPage() {
  const usedChannels = await getChannels();

  return (
    <AppLayout>
      <div className="creditos-page">
        <Breadcrumbs
          items={[{ name: 'Inicio', href: '/' }, { name: 'Créditos' }]}
        />
        <header className="creditos-hero">
          <h1>Créditos y fuentes</h1>
          <p>
            Todo el contenido reproducible en MundoBL se embebe directamente
            desde los canales oficiales de las productoras que lo crean. Acá
            listamos las fuentes que usamos y a las que les debemos
            reconocimiento.
          </p>
          <p className="creditos-hero__legal">
            ¿Sos titular de derechos y querés solicitar la baja de un embed?{' '}
            <Link href="/legal">Aviso legal y contacto</Link>.
          </p>
        </header>

        {usedChannels.length > 0 && (
          <section className="creditos-section">
            <h2>Canales usados actualmente</h2>
            <p className="creditos-section__sub">
              Productoras cuyo contenido oficial está embebido en MundoBL ahora
              mismo.
            </p>
            <div className="creditos-grid">
              {usedChannels.map((c) => (
                <Card
                  key={`${c.platform}-${c.name}`}
                  className="creditos-card"
                  size="small"
                >
                  <div className="creditos-card__head">
                    <h3>{c.name}</h3>
                    <Tag color="red" icon={<YoutubeOutlined />}>
                      {c.platform}
                    </Tag>
                  </div>
                  <p className="creditos-card__stats">
                    {c.seriesCount} {c.seriesCount === 1 ? 'serie' : 'series'} ·{' '}
                    {c.episodesCount}{' '}
                    {c.episodesCount === 1 ? 'episodio' : 'episodios'}
                  </p>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="creditos-card__link"
                    >
                      <LinkOutlined /> Visitar canal
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="creditos-section">
          <h2>Fuentes recomendadas</h2>
          <p className="creditos-section__sub">
            Productoras que sabemos que publican BL/GL completo y legal en
            YouTube. Algunas pueden no estar todavía en nuestro catálogo.
          </p>
          <div className="creditos-grid">
            {CURATED_CHANNELS.map((c) => (
              <Card key={c.name} className="creditos-card" size="small">
                <div className="creditos-card__head">
                  <h3>{c.name}</h3>
                  <Tag>{c.country}</Tag>
                </div>
                <p className="creditos-card__desc">{c.description}</p>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="creditos-card__link"
                >
                  <YoutubeOutlined /> Ir al canal
                </a>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
