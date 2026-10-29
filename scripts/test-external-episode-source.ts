import assert from 'node:assert/strict';
import {
  parseEpisodeSource,
  getEpisodeSourceErrorKey,
} from '../src/lib/episode-platforms';
import {
  detectPlatform,
  getEmbedInfo,
  getVimeoId,
} from '../src/lib/embed-helpers';
import {
  verifyExternalEpisode,
  EpisodeSourceError,
} from '../src/lib/external-episode-source';
import type { OfficialVideoPublisher } from '../src/lib/official-video-publishers';
import { resolveOfficialEmbedFields } from '../src/lib/official-content-guard';
import { probeExternalEpisode } from '../src/lib/external-episode-source';

async function main() {
  for (const bad of [
    'https://evil.test/youtube.com/watch?v=abcdefghijk',
    'https://vimeo.com.evil.test/129009162',
    'https://vimeo.com@evil.test/129009162',
    'https://evil.test/?url=https://vimeo.com/129009162',
    'https://vimeo.com:444/129009162',
    'javascript:alert(1)',
    'https://vimeo.com/129009162/invalid-hash',
    'https://www.youtube.com/watch?v=abcdefghijkMORE',
  ])
    assert.equal(parseEpisodeSource(bad), null, bad);
  assert.equal(detectPlatform('https://evil.test/?vimeo.com'), null);
  assert.equal(
    getVimeoId('https://vimeo.com/channels/staffpicks/129009162'),
    '129009162'
  );
  assert.equal(
    parseEpisodeSource('https://youtu.be/abcdefghijk?t=5')?.url,
    'https://www.youtube.com/watch?v=abcdefghijk'
  );
  assert.equal(
    getEpisodeSourceErrorKey('episodeSource.unavailable'),
    'episodeSource.unavailable'
  );
  assert.equal(getEpisodeSourceErrorKey('arbitrary.key'), null);
  assert.match(
    getEmbedInfo('Vimeo', 'https://vimeo.com/123/abcd', '123').url!,
    /h=abcd/
  );
  assert.equal(
    getEmbedInfo('Vimeo', 'https://vimeo.com/123', '123?bad').url,
    null
  );

  const vimeo = parseEpisodeSource('https://vimeo.com/129009162')!;
  let metadata: Record<string, unknown> = {
    uri: '/videos/129009162',
    name: 'Yu and Rachel',
    duration: 733,
    user: { uri: '/users/7732934' },
    status: 'available',
    privacy: { view: 'anybody', embed: 'public' },
  };
  let publicData: Record<string, unknown> = {
    video_id: 129009162,
    type: 'video',
  };
  let responseStatus = 200;
  const requests: Array<{ url: string; authorization: string | null }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = input.toString();
    requests.push({
      url,
      authorization: new Headers(init?.headers).get('authorization'),
    });
    assert.equal(init?.redirect, 'error');
    return Response.json(
      url.startsWith('https://api.vimeo.com/') ? metadata : publicData,
      { status: responseStatus }
    );
  };
  const options = { fetcher, vimeoToken: 'test-token' };
  const verified = await verifyExternalEpisode(vimeo, options);
  assert.equal(verified.ownerId, '7732934');
  assert.equal(verified.channelName, 'WU ZI-EN');
  assert.equal(verified.probe.durationSeconds, 733);
  assert.deepEqual(
    requests.map((request) => request.authorization),
    ['Bearer test-token', null]
  );
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.VIMEO_ACCESS_TOKEN;
  try {
    globalThis.fetch = fetcher;
    process.env.VIMEO_ACCESS_TOKEN = 'test-token';
    const resolved = await resolveOfficialEmbedFields({
      embedUrl: 'https://player.vimeo.com/video/129009162',
      embedPlatform: 'Vimeo',
    });
    assert.ok(resolved.ok);
    assert.equal(resolved.fields.embedUrl, 'https://vimeo.com/129009162');
    assert.equal(resolved.fields.embedChannelName, 'WU ZI-EN');
    assert.equal(resolved.fields.youtubeLikeCount, null);
    assert.equal(resolved.fields.youtubeViewCount, null);
    assert.equal(resolved.fields.durationSeconds, 733);
    const mismatch = await resolveOfficialEmbedFields({
      embedUrl: vimeo.url,
      embedPlatform: 'YouTube',
    });
    assert.ok(!mismatch.ok);
    assert.equal(mismatch.errorKey, 'episodeSource.unsupported');
    responseStatus = 429;
    assert.equal((await probeExternalEpisode(vimeo)).status, 'UNKNOWN');
    responseStatus = 200;
    const cleared = await resolveOfficialEmbedFields({ embedUrl: '' });
    assert.ok(cleared.ok);
    assert.equal(cleared.fields.playback, 'UNKNOWN');
    assert.equal(cleared.fields.youtubeLikeCount, null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.VIMEO_ACCESS_TOKEN;
    else process.env.VIMEO_ACCESS_TOKEN = originalToken;
  }
  const rejects = async (code: string, status = 422) => {
    await assert.rejects(
      verifyExternalEpisode(vimeo, options),
      (error: unknown) =>
        error instanceof EpisodeSourceError &&
        error.code === code &&
        error.status === status
    );
  };
  metadata = { ...metadata, user: { uri: '/users/666' } };
  await rejects('unverified');
  metadata = { ...metadata, user: { uri: '/users/7732934' }, duration: 43 };
  await rejects('tooShort');
  metadata = {
    ...metadata,
    duration: 733,
    privacy: { view: 'anybody', embed: 'whitelist' },
  };
  await rejects('notPlayable');
  metadata = { ...metadata, privacy: { view: 'password', embed: 'public' } };
  await rejects('notPlayable');
  metadata = { ...metadata, privacy: { view: 'anybody', embed: 'public' } };
  publicData = { video_id: 999, type: 'video' };
  await rejects('notPlayable');
  publicData = { video_id: 129009162, type: 'video' };
  responseStatus = 429;
  await rejects('unavailable', 503);
  responseStatus = 401;
  await rejects('unavailable', 503);

  const dm = parseEpisodeSource('https://dai.ly/xabc123')!;
  const publishers: OfficialVideoPublisher[] = [
    {
      platform: 'Dailymotion',
      ownerId: 'owner123',
      name: 'Official fixture',
      profileUrl: 'https://www.dailymotion.com/officialfixture',
      evidenceUrl: 'https://example.org',
      videoIds: ['xabc123'],
    },
  ];
  let dmMetadata: Record<string, unknown> = {
    id: 'xabc123',
    title: 'Fixture episode',
    duration: 700,
    'owner.id': 'owner123',
    private: false,
    status: 'published',
    explicit: false,
    allow_embed: true,
    geoblocking: ['allow'],
  };
  const dmFetcher: typeof fetch = async (input, init) => {
    assert.equal(new Headers(init?.headers).get('authorization'), null);
    const url = new URL(input.toString());
    if (url.hostname === 'api.dailymotion.com')
      return Response.json(dmMetadata);
    const player = url.searchParams.get('player');
    return Response.json({
      type: 'video',
      html: player
        ? `<iframe src="https://geo.dailymotion.com/player/${player}.html?video=xabc123"></iframe>`
        : '<iframe src="https://www.dailymotion.com/embed/video/xabc123"></iframe>',
    });
  };
  // Sin Player ID (cuenta de Creator Studio) vale el embed clasico.
  assert.equal(
    (
      await verifyExternalEpisode(dm, {
        fetcher: dmFetcher,
        playerId: '',
        publishers,
      })
    ).probe.status,
    'OK'
  );
  const dmOptions = { fetcher: dmFetcher, playerId: 'fixture1', publishers };
  assert.equal((await verifyExternalEpisode(dm, dmOptions)).probe.status, 'OK');
  dmMetadata = { ...dmMetadata, geoblocking: ['deny', 'AR'] };
  await assert.rejects(
    verifyExternalEpisode(dm, dmOptions),
    (error: unknown) =>
      error instanceof EpisodeSourceError && error.code === 'notPlayable'
  );
  dmMetadata = { ...dmMetadata, geoblocking: [], explicit: true };
  await assert.rejects(
    verifyExternalEpisode(dm, dmOptions),
    (error: unknown) =>
      error instanceof EpisodeSourceError && error.code === 'notPlayable'
  );
  console.log(
    'Official sources: URL identity, publisher, anonymous access, privacy, duration, outages and Dailymotion configuration passed.'
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
