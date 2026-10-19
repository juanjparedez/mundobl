import assert from 'node:assert/strict';
import {
  prisma,
  getSimilarSeries,
  getRecommendationsForUser,
} from '../src/lib/database';
import { scoreRecommendations } from '../src/lib/recommendations';
import { assertLocalTestDatabase } from './assert-local-test-database';

const PREFIX = 'Reco test';

function scoringCases() {
  const seed = { id: 1, title: 'Seed', weight: 1 };
  const results = scoreRecommendations(
    [{ ...seed, tagIds: [1, 2], genreIds: [1], actorIds: [7] }],
    [
      // Solo un genero en comun: no alcanza.
      { id: 2, tagIds: [], genreIds: [1], actorIds: [] },
      // Un actor alcanza solo.
      { id: 3, tagIds: [], genreIds: [], actorIds: [7] },
      // Dos tags.
      { id: 4, tagIds: [1, 2], genreIds: [], actorIds: [] },
      // Un tag + genero, con mejor rating que 6 para el desempate.
      { id: 5, tagIds: [1], genreIds: [1], actorIds: [], overallRating: 9 },
      { id: 6, tagIds: [1], genreIds: [1], actorIds: [], overallRating: 2 },
    ],
    10
  );
  const ids = results.map((r) => r.candidate.id);
  assert.ok(!ids.includes(2), 'a single shared genre is not similar');
  assert.ok(ids.includes(3), 'a shared actor is enough');
  assert.ok(ids.indexOf(5) < ids.indexOf(6), 'rating breaks ties');
  assert.equal(results[0].becauseOf?.id, 1);

  // Con dos semillas, el motivo es la que mas aporta.
  const [top] = scoreRecommendations(
    [
      {
        id: 10,
        title: 'A',
        weight: 1,
        tagIds: [1],
        genreIds: [],
        actorIds: [],
      },
      {
        id: 11,
        title: 'B',
        weight: 1,
        tagIds: [],
        genreIds: [],
        actorIds: [9],
      },
    ],
    [{ id: 12, tagIds: [1], genreIds: [], actorIds: [9] }],
    1
  );
  assert.equal(top.becauseOf?.title, 'B');
}

async function main() {
  assertLocalTestDatabase();
  scoringCases();

  const [romance, office] = await Promise.all(
    ['Romance', 'Office'].map((name) =>
      prisma.tag.create({ data: { name: `${PREFIX} ${name}` } })
    )
  );
  const genre = await prisma.genre.create({ data: { name: `${PREFIX} BL` } });
  const actor = await prisma.actor.create({
    data: { name: `${PREFIX} Actor` },
  });
  const universe = await prisma.universe.create({
    data: { name: `${PREFIX} Universe` },
  });

  const make = (
    title: string,
    opts: {
      tags?: number[];
      actors?: number[];
      universeId?: number;
      contentRating?: string;
      origin?: string;
    } = {}
  ) =>
    prisma.series.create({
      data: {
        title: `${PREFIX} ${title}`,
        type: 'serie',
        universeId: opts.universeId,
        contentRating: opts.contentRating,
        origin: opts.origin,
        genres: { create: [{ genreId: genre.id }] },
        tags: { create: (opts.tags ?? []).map((tagId) => ({ tagId })) },
        actors: {
          create: (opts.actors ?? []).map((actorId) => ({ actorId })),
        },
      },
    });

  const source = await make('Source', {
    tags: [romance.id, office.id],
    actors: [actor.id],
    universeId: universe.id,
  });
  const sibling = await make('Sibling', {
    tags: [romance.id, office.id],
    universeId: universe.id,
  });
  const twoTags = await make('Two tags', { tags: [romance.id, office.id] });
  const sameActor = await make('Same actor', { actors: [actor.id] });
  const adult = await make('Adult', {
    tags: [romance.id, office.id],
    contentRating: 'ADULT18',
  });
  const userEmbed = await make('User embed', {
    tags: [romance.id, office.id],
    origin: 'USER_EMBED',
  });
  const unrelated = await make('Unrelated');

  const user = await prisma.user.create({
    data: { email: `reco-${Date.now()}@example.test` },
  });
  const otherUser = await prisma.user.create({
    data: { email: `reco-other-${Date.now()}@example.test` },
  });

  try {
    const similar = (await getSimilarSeries(source.id)).map((s) => s.id);
    assert.ok(similar.includes(twoTags.id));
    assert.ok(similar.includes(sameActor.id));
    assert.ok(!similar.includes(source.id), 'not itself');
    assert.ok(!similar.includes(sibling.id), 'universe shown elsewhere');
    assert.ok(!similar.includes(adult.id), 'never +18');
    assert.ok(!similar.includes(userEmbed.id), 'only the public catalog');
    assert.ok(!similar.includes(unrelated.id));

    // Sin biblioteca: lo mas seguido.
    await prisma.viewStatus.create({
      data: { userId: otherUser.id, seriesId: unrelated.id, status: 'VIENDO' },
    });
    const cold = await getRecommendationsForUser(user.id);
    assert.equal(cold.kind, 'popular');
    assert.equal(cold.series[0]?.id, unrelated.id);

    // Termino la fuente y ya sigue "Two tags": se sugiere el resto.
    await prisma.viewStatus.createMany({
      data: [
        { userId: user.id, seriesId: source.id, status: 'VISTA' },
        { userId: user.id, seriesId: twoTags.id, status: 'VIENDO' },
      ],
    });
    const personal = await getRecommendationsForUser(user.id);
    assert.equal(personal.kind, 'personal');
    const ids = personal.series.map((s) => s.id);
    assert.ok(ids.includes(sameActor.id));
    assert.ok(ids.includes(sibling.id), 'next entry of a universe is fine');
    assert.ok(!ids.includes(twoTags.id), 'already in the library');
    assert.ok(!ids.includes(source.id));
    assert.ok(!ids.includes(adult.id));
    assert.equal(
      personal.series.find((s) => s.id === sameActor.id)?.becauseOf?.id,
      source.id
    );
    console.log('recommendations: ok');
  } finally {
    await prisma.user.deleteMany({
      where: { id: { in: [user.id, otherUser.id] } },
    });
    await prisma.series.deleteMany({
      where: { title: { startsWith: PREFIX } },
    });
    await prisma.tag.deleteMany({ where: { name: { startsWith: PREFIX } } });
    await prisma.genre.delete({ where: { id: genre.id } });
    await prisma.actor.delete({ where: { id: actor.id } });
    await prisma.universe.delete({ where: { id: universe.id } });
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
