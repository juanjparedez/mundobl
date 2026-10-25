import initial from './ver-content-2026-10-24.json';
import expanded from './ver-content-youtube-expanded-2026-10-24.json';
import vimeo from './ver-content-vimeo-2026-10-24.json';
import more from './ver-content-2026-10-25.json';
import type { WatchContentBatch } from '../../src/lib/watch-content-batch';

/** Each release verifies and applies only its own videos. */
export const VER_BATCHES = {
  '2026-10-24': {
    videos: 115,
    build: (): WatchContentBatch => ({
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
    }),
  },
  '2026-10-25': {
    videos: 125,
    build: (): WatchContentBatch => ({
      id: more.id,
      verifiedAt: more.verifiedAt,
      series: more.series,
    }),
  },
} as const;

export type VerBatchName = keyof typeof VER_BATCHES;

/** Reads the required --batch= argument; there is no implicit default. */
export function verBatchArg(args: string[]): VerBatchName {
  const name = args.find((arg) => arg.startsWith('--batch='))?.slice(8);
  if (!name || !(name in VER_BATCHES)) {
    throw new Error(`Provide --batch=${Object.keys(VER_BATCHES).join('|')}.`);
  }
  return name as VerBatchName;
}

export function verContentBatch(name: VerBatchName): WatchContentBatch {
  return VER_BATCHES[name].build();
}
