import { prisma } from '@/lib/database';

export const revalidate = 600; // 10 minutos

const BASE_URL = 'https://mundobl.win';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const news = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      summary: true,
      sourceName: true,
      publishedAt: true,
      updatedAt: true,
      imageUrl: true,
    },
  });

  const lastBuildDate = (
    news[0]?.publishedAt ??
    news[0]?.updatedAt ??
    new Date()
  ).toUTCString();

  const items = news
    .map((n) => {
      const link = `${BASE_URL}/noticias/${n.id}`;
      const pubDate = (n.publishedAt ?? n.updatedAt).toUTCString();
      const description = escapeXml(n.summary.slice(0, 500));
      const enclosure = n.imageUrl
        ? `<enclosure url="${escapeXml(n.imageUrl)}" type="image/jpeg" />`
        : '';
      const source = n.sourceName
        ? `<source url="${link}">${escapeXml(n.sourceName)}</source>`
        : '';
      return `    <item>
      <title>${escapeXml(n.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${enclosure}
      ${source}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MundoBL - Noticias BL/GL</title>
    <link>${BASE_URL}/noticias</link>
    <atom:link href="${BASE_URL}/noticias/rss.xml" rel="self" type="application/rss+xml" />
    <description>Últimas noticias del mundo BL y GL: estrenos, anuncios y novedades de la comunidad.</description>
    <language>es</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
    },
  });
}
