import assert from 'node:assert/strict';
import { playableCountIn, summarizePlayability } from '../src/lib/availability';
import { isPlayableIn, type PlaybackStatus } from '../src/lib/playability';

// /ver manda el resumen y cuenta en el cliente: tiene que dar lo mismo que
// contar episodio por episodio con isPlayableIn, en cualquier mercado.
const episodes: Array<{
  playback: PlaybackStatus;
  playbackBlockedMarkets: string[];
}> = [
  { playback: 'OK', playbackBlockedMarkets: [] },
  { playback: 'UNKNOWN', playbackBlockedMarkets: [] },
  { playback: 'GEO_BLOCKED', playbackBlockedMarkets: ['AR', 'MX'] },
  { playback: 'GEO_BLOCKED', playbackBlockedMarkets: ['AR', 'AR'] },
  { playback: 'GEO_BLOCKED', playbackBlockedMarkets: ['US'] },
  { playback: 'AGE_RESTRICTED', playbackBlockedMarkets: [] },
  { playback: 'REMOVED', playbackBlockedMarkets: [] },
  { playback: 'NOT_EMBEDDABLE', playbackBlockedMarkets: [] },
];

const summary = summarizePlayability(episodes);
assert.deepEqual(summary, {
  blockedEverywhere: 3,
  blockedByMarket: { AR: 2, MX: 1, US: 1 },
});

for (const market of ['AR', 'MX', 'US', 'ES', 'JP']) {
  const expected = episodes.filter((e) =>
    isPlayableIn(e.playback, e.playbackBlockedMarkets, market)
  ).length;
  assert.equal(playableCountIn(episodes.length, summary, market), expected);
}

// Sin pais conocido solo se descuenta lo que no anda en ningun lado.
assert.equal(playableCountIn(episodes.length, summary, null), 5);
assert.equal(
  playableCountIn(0, summarizePlayability([]), 'AR'),
  0,
  'sin episodios no hay negativos'
);

console.log('playability-summary: OK');
