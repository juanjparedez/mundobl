import assert from 'node:assert/strict';
import {
  getCategoryLabel,
  getCategoryOptions,
  getCategoryRank,
  getEmbedInfo,
  getYouTubePlaylistId,
  resolveContentCategory,
} from '../src/lib/embed-helpers';
import { dailymotionEmbedUrl } from '../src/lib/episode-platforms';
import type { TranslationKey } from '../src/i18n/messages';

const PLAYLIST =
  'https://www.youtube.com/playlist?list=PLHEh98tE475ETfe_jjYvQWiPseN4yo7eR';
const VIDEO_IN_PLAYLIST =
  'https://www.youtube.com/watch?v=Tsf3XDVkXYg&list=PLKYFzHcwIrVQ&index=4';

// Dailymotion sin Player ID cae al embed clasico (sirve para cualquier video
// publico); con ID usa el reproductor nuevo.
const dailymotionEmbed = getEmbedInfo(
  'Dailymotion',
  'https://www.dailymotion.com/video/xabc123',
  null
);
assert.equal(dailymotionEmbed.type, 'iframe');
if (!process.env.NEXT_PUBLIC_DAILYMOTION_PLAYER_ID)
  assert.equal(
    dailymotionEmbed.url,
    'https://www.dailymotion.com/embed/video/xabc123'
  );
assert.equal(
  dailymotionEmbedUrl('xabc123', true, 'xplayer1'),
  'https://geo.dailymotion.com/player/xplayer1.html?video=xabc123&autoplay=1'
);

// Una playlist pura se reconoce; un video abierto desde una playlist no.
assert.equal(
  getYouTubePlaylistId(PLAYLIST),
  'PLHEh98tE475ETfe_jjYvQWiPseN4yo7eR'
);
assert.equal(getYouTubePlaylistId(VIDEO_IN_PLAYLIST), null);
assert.equal(
  getYouTubePlaylistId('https://evil.test/playlist?list=PLHEh98tE475ETfe'),
  null
);
assert.equal(
  getYouTubePlaylistId('https://www.youtube.com/playlist?list=<script>'),
  null
);

// La playlist se embebe con videoseries en vez de caer al link-card.
const playlistEmbed = getEmbedInfo('YouTube', PLAYLIST, null);
assert.equal(playlistEmbed.type, 'iframe');
assert.ok(
  playlistEmbed.url?.startsWith(
    'https://www.youtube-nocookie.com/embed/videoseries?'
  ),
  playlistEmbed.url ?? 'sin url'
);
assert.equal(
  new URL(playlistEmbed.url ?? '').searchParams.get('list'),
  'PLHEh98tE475ETfe_jjYvQWiPseN4yo7eR'
);

// Un trailer dentro de una playlist sigue siendo ese video.
const videoEmbed = getEmbedInfo('YouTube', VIDEO_IN_PLAYLIST, 'Tsf3XDVkXYg');
assert.ok(
  videoEmbed.url?.includes('/embed/Tsf3XDVkXYg?'),
  videoEmbed.url ?? ''
);
assert.equal(new URL(videoEmbed.url ?? '').searchParams.get('list'), null);

// Categoria: una playlist nunca queda como trailer.
assert.equal(resolveContentCategory(PLAYLIST, 'trailer'), 'playlist');
assert.equal(resolveContentCategory(VIDEO_IN_PLAYLIST, 'trailer'), 'trailer');
assert.equal(resolveContentCategory(VIDEO_IN_PLAYLIST, ''), 'other');

// Labels traducidos y orden de grupos.
const t = (key: TranslationKey) => `t:${key}`;
assert.equal(getCategoryLabel('playlist', t), 't:contentCategory.playlist');
assert.equal(getCategoryLabel('legacy', t), 'legacy');
assert.ok(getCategoryOptions(t).some((o) => o.value === 'playlist'));
assert.ok(getCategoryRank('trailer') < getCategoryRank('playlist'));
assert.ok(getCategoryRank('playlist') < getCategoryRank('legacy'));

console.log('embed playlist: ok');
