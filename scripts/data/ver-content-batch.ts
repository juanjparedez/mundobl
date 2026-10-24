import initial from './ver-content-2026-10-24.json';
import expanded from './ver-content-youtube-expanded-2026-10-24.json';
import vimeo from './ver-content-vimeo-2026-10-24.json';
import type { WatchContentBatch } from '../../src/lib/watch-content-batch';

export function verContentBatch(): WatchContentBatch {
  return {
    id: 'ver-2026-10-24-expanded',
    verifiedAt: '2026-10-24',
    series: [
      ...initial.series,
      ...expanded.series,
      ...vimeo.series.map((series) => ({
        ...series,
        platform: 'Vimeo' as const,
        type: 'corto' as const,
      })),
    ],
  };
}
