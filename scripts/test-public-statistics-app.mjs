import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { encode } from 'next-auth/jwt';
const require = createRequire(import.meta.url);
require('./assert-local-test-database.ts').assertLocalTestDatabase();
const { prisma } = require('../src/lib/database.ts');
const base = process.env.COMMUNITY_APP_TEST_URL ?? 'http://127.0.0.1:3223';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.equal(process.env.AUTH_SECRET, 'community-full-app-test-only');
const key = `public-stats-app-${Date.now()}`;
const users = [key, `${key}-other`, `${key}-admin`];
let series;
const pilotDay = new Date(new Date().toISOString().slice(0, 10));
const pilotBefore = await prisma.pilotClickDaily.findUnique({
  where: { day_placement: { day: pilotDay, placement: 'platforms' } },
});
try {
  // Warm authentication first: the shared Prisma client can originate in a
  // different webpack bundle. Native SQL tests alone cannot catch this case.
  assert.equal((await fetch(base + '/api/auth/session')).status, 200);
  await prisma.user.createMany({
    data: users.map((id, index) => ({
      id,
      email: `${id}@example.invalid`,
      role: index === 2 ? 'ADMIN' : 'VISITOR',
    })),
  });
  series = await prisma.series.create({ data: { title: key, type: 'serie' } });
  await prisma.userFavorite.createMany({
    data: users.map((userId) => ({ userId, seriesId: series.id })),
  });
  const api = await fetch(base + '/api/stats/public');
  assert.equal(
    api.status,
    200,
    'Composed SQL must work with the bundled/shared Prisma client'
  );
  const stats = await api.json();
  assert.equal(
    stats.rankings.topFavorited.find((row) => row.seriesId === series.id)
      ?.count,
    2
  );
  assert.equal(stats.watch.playsByDay.length, 30);
  assert.equal(
    stats.watch.playsByDay.reduce((n, row) => n + row.starts, 0),
    stats.watch.totals.playStarts
  );
  assert.equal(
    stats.watch.playsByDay.reduce((n, row) => n + row.completions, 0),
    stats.watch.totals.completedPlays
  );
  assert.ok(stats.watch.topSeries.every((row) => row.starts > 0));
  assert.match(api.headers.get('cache-control'), /s-maxage=900/);
  const page = await fetch(base + '/estadisticas');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Finalizaciones registradas/);
  const detailUrl = `${base}/series/${series.id}`;
  assert.match(await (await fetch(detailUrl)).text(), /2 favoritos/);
  const jwt = await encode({
    secret: process.env.AUTH_SECRET,
    salt: 'authjs.session-token',
    maxAge: 3600,
    token: {
      id: key,
      sub: key,
      email: `${key}@example.invalid`,
      role: 'VISITOR',
      banned: false,
      roleCheckedAt: 0,
    },
  });
  const toggle = await fetch(`${base}/api/series/${series.id}/favorite`, {
    method: 'POST',
    headers: {
      cookie: `authjs.session-token=${jwt}`,
      origin: base,
    },
  });
  assert.equal(toggle.status, 200);
  assert.equal((await toggle.json()).isFavorite, false);
  let fresh = false;
  for (let attempt = 0; attempt < 10 && !fresh; attempt++) {
    fresh = /1 favorito/.test(await (await fetch(detailUrl)).text());
    if (!fresh) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(fresh, 'Favorite mutation must invalidate the cached detail');
  assert.equal(
    await prisma.userFavorite.count({ where: { seriesId: series.id } }),
    2,
    'Staff favorite is preserved, only excluded from public count'
  );
  const season = await prisma.season.create({
    data: {
      seriesId: series.id,
      seasonNumber: 1,
      episodes: {
        create: [
          { episodeNumber: 1 },
          { episodeNumber: 2 },
          { episodeNumber: 3 },
        ],
      },
    },
    include: { episodes: { orderBy: { episodeNumber: 'asc' } } },
  });
  const [tracked, noted, unused] = season.episodes;
  await prisma.viewStatus.create({
    data: {
      userId: key,
      episodeId: tracked.id,
      status: 'VISTA',
      watchedDate: new Date(),
    },
  });
  await prisma.episodeNote.create({
    data: {
      userId: key,
      episodeId: noted.id,
      body: 'Private note must survive',
    },
  });
  const adminJwt = await encode({
    secret: process.env.AUTH_SECRET,
    salt: 'authjs.session-token',
    maxAge: 3600,
    token: {
      id: users[2],
      sub: users[2],
      email: `${users[2]}@example.invalid`,
      role: 'ADMIN',
      banned: false,
      roleCheckedAt: 0,
    },
  });
  const adminHeaders = { cookie: `authjs.session-token=${adminJwt}` };
  const adminStats = await fetch(base + '/api/admin/stats', {
    headers: adminHeaders,
  });
  assert.equal(adminStats.status, 200);
  assert.match(adminStats.headers.get('cache-control'), /private, no-store/);
  const administrative = await adminStats.json();
  assert.equal(
    administrative.rankings.favorited.find((row) => row.seriesId === series.id)
      ?.count,
    1
  );
  assert.equal(administrative.distribution.completedByDay.length, 30);
  const forbiddenStats = await fetch(base + '/api/admin/stats', {
    headers: { cookie: `authjs.session-token=${jwt}` },
  });
  assert.equal(forbiddenStats.status, 403);
  for (const path of [
    '/admin/stats',
    '/admin/informe-productoras?dias=30',
    '/admin/informe-productoras?dias=90',
    '/admin/piloto',
  ]) {
    const response = await fetch(base + path, { headers: adminHeaders });
    assert.equal(response.status, 200, path);
    if (path !== '/admin/stats')
      assert.match(await response.text(), /Consultado:/, path);
  }
  const pilotClick = (token) =>
    fetch(base + '/api/pilot-clicks', {
      method: 'POST',
      headers: {
        cookie: `authjs.session-token=${token}`,
        origin: base,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ placement: 'platforms' }),
    });
  const pilotCount = async () =>
    (
      await prisma.pilotClickDaily.findUnique({
        where: { day_placement: { day: pilotDay, placement: 'platforms' } },
      })
    )?.clicks ?? 0;
  assert.equal((await pilotClick(adminJwt)).status, 204);
  assert.equal(
    await pilotCount(),
    pilotBefore?.clicks ?? 0,
    'Staff pilot clicks must not inflate the report'
  );
  assert.equal((await pilotClick(jwt)).status, 204);
  assert.equal(
    await pilotCount(),
    (pilotBefore?.clicks ?? 0) + 1,
    'Community click must reach the live aggregate'
  );
  console.log(
    'PASS: compiled admin statistics, producer report 30/90 days, pilot report, private cache and real pilot click exclusion/increment'
  );
  const remove = (path, token = adminJwt) =>
    fetch(base + path, {
      method: 'DELETE',
      headers: { cookie: `authjs.session-token=${token}`, origin: base },
    });
  assert.equal((await remove(`/api/episodes/${tracked.id}`, jwt)).status, 403);
  for (const path of [
    `/api/series/${series.id}`,
    `/api/seasons/${season.id}`,
    `/api/episodes/${tracked.id}`,
    `/api/episodes/${noted.id}`,
  ]) {
    const response = await remove(path);
    assert.equal(response.status, 409, path);
    assert.equal(
      (await response.json()).code,
      'TRACKING_PRESERVATION_REQUIRED'
    );
  }
  assert.equal(
    (await remove(`/api/episodes/${unused.id}`)).status,
    200,
    'Untracked sibling can still be deleted'
  );
  await prisma.series.update({
    where: { id: series.id },
    data: { origin: 'USER_EMBED', catalogScope: 'WATCHABLE_ONLY' },
  });
  assert.equal(
    (await remove(`/api/admin/user-series/${series.id}`)).status,
    409,
    'Contributions preserve tracking too'
  );
  assert.equal(
    await prisma.viewStatus.count({
      where: { userId: key, episodeId: tracked.id },
    }),
    1
  );
  assert.equal(
    await prisma.episodeNote.count({
      where: { userId: key, episodeId: noted.id },
    }),
    1
  );
  const emptySeason = await prisma.season.create({
    data: { seriesId: series.id, seasonNumber: 2 },
  });
  assert.equal((await remove(`/api/seasons/${emptySeason.id}`)).status, 200);
  console.log(
    'PASS: compiled deletion routes reject private tracking/notes, preserve data and allow untracked siblings; staff authorization enforced'
  );
  console.log(
    'PASS: compiled public statistics API and page, bundled SQL, playback reconciliation, community favorites and actual ISR invalidation'
  );
} finally {
  if (pilotBefore)
    await prisma.pilotClickDaily.update({
      where: { day_placement: { day: pilotDay, placement: 'platforms' } },
      data: { clicks: pilotBefore.clicks },
    });
  else
    await prisma.pilotClickDaily.deleteMany({
      where: { day: pilotDay, placement: 'platforms' },
    });
  if (series) await prisma.series.delete({ where: { id: series.id } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
}
