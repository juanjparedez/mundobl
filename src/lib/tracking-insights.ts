import { groupIntoChapters, type EpisodeRow } from './episode-chapters';

export type InsightsPeriod = 7 | 30 | 365;
export interface InsightEpisode extends EpisodeRow {
  watchedDate: Date | null;
  watched: boolean;
  durationSeconds: number | null;
  duration: number | null;
}
export interface InsightSeries {
  id: number;
  title: string;
  href: string;
  completedDate: Date | null;
  episodes: InsightEpisode[];
}

const DAY = 86_400_000;
export function insightsRange(days: InsightsPeriod, now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY
  );
  return {
    start: new Date(+end - days * DAY),
    previousStart: new Date(+end - 2 * days * DAY),
    end,
  };
}

/** Current marks only: a rewatch is not a second event. Dates use the same UTC
 * calendar as watch-date.ts. A chapter needs every registered sibling part. */
export function aggregateInsights(
  series: InsightSeries[],
  days: InsightsPeriod,
  now = new Date()
) {
  const range = insightsRange(days, now);
  const empty = () => ({
    chapters: 0,
    series: 0,
    minutes: 0,
    unknownDurations: 0,
  });
  const current = empty();
  const previous = empty();
  const rows: {
    id: number;
    title: string;
    href: string;
    chapters: number;
    minutes: number;
    completed: boolean;
  }[] = [];
  function bucket(date: Date | null) {
    if (
      !date ||
      !Number.isFinite(+date) ||
      +date > +now ||
      +date < +range.previousStart
    )
      return null;
    return +date >= +range.start ? current : previous;
  }
  for (const item of series) {
    let hasActivity = false;
    const row = {
      id: item.id,
      title: item.title,
      href: item.href,
      chapters: 0,
      minutes: 0,
      completed: false,
    };
    const completion = bucket(item.completedDate);
    if (completion) completion.series++;
    row.completed = completion === current;
    for (const chapter of groupIntoChapters(item.episodes).chapters) {
      if (
        chapter.episodes.every(
          (ep) => ep.watched && ep.watchedDate && +ep.watchedDate <= +now
        )
      ) {
        const last = new Date(
          Math.max(...chapter.episodes.map((ep) => +ep.watchedDate!))
        );
        const target = bucket(last);
        if (target) target.chapters++;
        if (target === current) row.chapters++;
      }
      for (const ep of chapter.episodes) {
        const target = ep.watched ? bucket(ep.watchedDate) : null;
        if (!target) continue;
        if (target === current) hasActivity = true;
        const minutes =
          (ep.durationSeconds ?? 0) > 0
            ? ep.durationSeconds! / 60
            : Math.max(0, ep.duration ?? 0);
        target.minutes += minutes;
        if (!minutes) target.unknownDurations++;
        if (target === current) row.minutes += minutes;
      }
    }
    if (hasActivity || row.chapters || row.completed) rows.push(row);
  }
  rows.sort(
    (a, b) => b.chapters - a.chapters || b.minutes - a.minutes || a.id - b.id
  );
  return {
    days,
    start: range.start.toISOString(),
    end: new Date(+range.end - DAY).toISOString(),
    previousStart: range.previousStart.toISOString(),
    previousEnd: new Date(+range.start - DAY).toISOString(),
    current,
    previous,
    rows,
  };
}

export type TrackingInsights = ReturnType<typeof aggregateInsights> & {
  unknownDates: number;
};
