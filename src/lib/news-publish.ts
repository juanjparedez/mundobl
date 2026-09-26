import { revalidatePath } from 'next/cache';
import { notifySeriesSubscribers } from './notifications';
import { revalidateSeriesDetail } from './revalidate-series';

interface PublishedNews {
  id: number;
  title: string;
  relatedSeries: { id: number; title: string } | null;
}

/**
 * Una noticia publica cambio (se publico, se edito o se bajo): se rehacen
 * la lista, el detalle, el RSS, la home y la ficha de su serie, en vez de
 * esperar a que venza el ISR.
 */
export function revalidateNews(news: PublishedNews): void {
  revalidatePath('/noticias');
  revalidatePath(`/noticias/${news.id}`);
  revalidatePath('/noticias/rss.xml');
  revalidatePath('/');
  if (news.relatedSeries) revalidateSeriesDetail(news.relatedSeries);
}

/** Aviso a quienes siguen la serie de la noticia recien publicada. */
export async function notifyNewsPublished(news: PublishedNews): Promise<void> {
  if (!news.relatedSeries) return;
  await notifySeriesSubscribers({
    seriesId: news.relatedSeries.id,
    type: 'news_published',
    title: `Noticia de ${news.relatedSeries.title}: ${news.title}`,
    refType: 'news',
    refId: news.id,
    linkPath: `/noticias/${news.id}`,
  });
}
