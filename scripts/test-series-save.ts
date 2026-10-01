import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import { subscribeOnFirstTrack } from '../src/lib/tracking';
import {
  SeriesEditConflictError,
  saveSeriesFromForm,
  type SeriesFormBody,
} from '../src/lib/series-save';

// Guardado del form de edicion contra PostgreSQL real (descartable). Cubre lo
// que fallo el 29/09 con "Poisoned chalice": pestaña vieja que pisa, guardado
// a medias y falta de historial.
const IMAGE = { url: null, thumbUrl: null };

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.equal(url.pathname, '/mundobl_replay');

  const runId = Date.now();
  const tagNames = Array.from({ length: 11 }, (_, i) => `Tag ${runId} ${i}`);
  const other = await prisma.series.create({
    data: { title: `Relacionada ${runId}`, type: 'serie' },
  });
  const seriesIds = [other.id];

  const baseBody = (editVersion: number): SeriesFormBody => ({
    title: `Poisoned ${runId}`,
    editVersion,
    type: 'serie',
    synopsis: 'Sinopsis de Flor',
    actors: [
      // Mismo actor "-" con dos personajes: el caso real de la 705.
      {
        name: `- ${runId}`,
        character: 'Lee Doyoung',
        isMain: true,
        pairingGroup: 1,
      },
      {
        name: `- ${runId}`,
        character: 'Han Taeha',
        isMain: true,
        pairingGroup: 1,
      },
    ],
    tags: tagNames,
    genres: ['BL'],
    watchLinks: [
      { platform: 'YouTube', url: 'https://youtu.be/x', official: true },
    ],
    relatedSeriesIds: [other.id],
    seasons: [{ seasonNumber: 1, episodeCount: 3 }],
  });

  try {
    const series = await prisma.series.create({
      data: { title: `Poisoned ${runId}`, type: 'serie' },
    });
    seriesIds.push(series.id);

    // 1. Primer guardado: crea todo, version 0 -> 1, una foto.
    const first = await saveSeriesFromForm(
      series.id,
      baseBody(0),
      IMAGE,
      'flor'
    );
    assert.ok(first);
    assert.equal(first.updated.editVersion, 1);
    const tagsAfterFirst = await prisma.seriesTag.findMany({
      where: { seriesId: series.id },
      orderBy: { id: 'asc' },
    });
    assert.equal(tagsAfterFirst.length, 11);
    const actorsAfterFirst = await prisma.seriesActor.findMany({
      where: { seriesId: series.id },
      orderBy: { id: 'asc' },
    });
    assert.deepEqual(
      actorsAfterFirst.map((a) => a.character),
      ['Lee Doyoung', 'Han Taeha']
    );
    assert.equal(
      await prisma.relatedSeries.count({
        where: {
          OR: [{ mainSeriesId: series.id }, { relatedSeriesId: series.id }],
        },
      }),
      2
    );
    assert.equal(
      await prisma.episode.count({
        where: { season: { seriesId: series.id } },
      }),
      3
    );

    // 2. Guardar sin cambios no reescribe filas: los ids sobreviven.
    const seasonId = (
      await prisma.season.findFirstOrThrow({
        where: { seriesId: series.id },
      })
    ).id;
    const unchanged = await saveSeriesFromForm(
      series.id,
      {
        ...baseBody(1),
        seasons: [{ id: seasonId, seasonNumber: 1, episodeCount: 3 }],
      },
      IMAGE,
      'flor'
    );
    assert.equal(unchanged?.updated.editVersion, 2);
    assert.deepEqual(
      (
        await prisma.seriesTag.findMany({
          where: { seriesId: series.id },
          orderBy: { id: 'asc' },
        })
      ).map((t) => t.id),
      tagsAfterFirst.map((t) => t.id)
    );
    assert.deepEqual(
      (
        await prisma.seriesActor.findMany({
          where: { seriesId: series.id },
          orderBy: { id: 'asc' },
        })
      ).map((a) => a.id),
      actorsAfterFirst.map((a) => a.id)
    );

    // 3. Pestaña vieja (abrio en version 1, la ficha ya va por 2): 409 y nada cambia.
    await assert.rejects(
      saveSeriesFromForm(
        series.id,
        { ...baseBody(1), synopsis: 'Pisada', tags: [] },
        IMAGE,
        'otra'
      ),
      SeriesEditConflictError
    );
    // Sin version (pestaña abierta antes del deploy): tambien conflicto.
    await assert.rejects(
      saveSeriesFromForm(
        series.id,
        { ...baseBody(2), editVersion: undefined },
        IMAGE,
        'otra'
      ),
      SeriesEditConflictError
    );
    let fresh = await prisma.series.findUniqueOrThrow({
      where: { id: series.id },
    });
    assert.equal(fresh.synopsis, 'Sinopsis de Flor');
    assert.equal(fresh.editVersion, 2);
    assert.equal(
      await prisma.seriesTag.count({ where: { seriesId: series.id } }),
      11
    );

    // 4. Diff de etiquetas: saca una, agrega una nueva; las otras 10 conservan su fila.
    const swapped = [...tagNames.slice(1), `Nueva ${runId}`];
    await saveSeriesFromForm(
      series.id,
      { ...baseBody(2), tags: swapped, seasons: undefined },
      IMAGE,
      'flor'
    );
    const tagsAfterSwap = await prisma.seriesTag.findMany({
      where: { seriesId: series.id },
    });
    assert.equal(tagsAfterSwap.length, 11);
    const keptIds = new Set(tagsAfterFirst.slice(1).map((t) => t.id));
    assert.equal(tagsAfterSwap.filter((t) => keptIds.has(t.id)).length, 10);

    // 5. Historial: una foto por guardado, con la version reemplazada y quien guardo.
    const revisions = await prisma.seriesRevision.findMany({
      where: { seriesId: series.id },
      orderBy: { id: 'asc' },
    });
    assert.deepEqual(
      revisions.map((r) => r.editVersion),
      [0, 1, 2]
    );
    assert.ok(
      revisions.every((r) => r.userId === 'flor' && r.source === 'admin-form')
    );
    const lastSnapshot = revisions[2].snapshot as {
      tags: Array<{ tag: { name: string } }>;
    };
    assert.equal(lastSnapshot.tags.length, 11);
    assert.ok(lastSnapshot.tags.some((t) => t.tag.name === tagNames[0]));

    // 6. Atomicidad: si algo falla a mitad de camino (relacionada inexistente
    // -> violacion de FK), no se aplica nada: ni etiquetas, ni sinopsis, ni version.
    await assert.rejects(
      saveSeriesFromForm(
        series.id,
        {
          ...baseBody(3),
          synopsis: 'A medias',
          tags: [],
          seasons: undefined,
          relatedSeriesIds: [2147483000],
        },
        IMAGE,
        'flor'
      )
    );
    fresh = await prisma.series.findUniqueOrThrow({ where: { id: series.id } });
    assert.equal(fresh.synopsis, 'Sinopsis de Flor');
    assert.equal(fresh.editVersion, 3);
    assert.equal(
      await prisma.seriesTag.count({ where: { seriesId: series.id } }),
      11
    );
    assert.equal(
      await prisma.seriesRevision.count({ where: { seriesId: series.id } }),
      3
    );

    // 7. Dos guardados simultaneos desde la misma version: entra uno solo.
    const results = await Promise.allSettled([
      saveSeriesFromForm(
        series.id,
        { ...baseBody(3), synopsis: 'Pestaña A', seasons: undefined },
        IMAGE,
        'flor'
      ),
      saveSeriesFromForm(
        series.id,
        { ...baseBody(3), synopsis: 'Pestaña B', seasons: undefined },
        IMAGE,
        'flor'
      ),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const rejected = results.find((r) => r.status === 'rejected');
    assert.ok(rejected && rejected.reason instanceof SeriesEditConflictError);
    fresh = await prisma.series.findUniqueOrThrow({ where: { id: series.id } });
    assert.equal(fresh.editVersion, 4);

    // 8. Fila de reparto repetida (mismo actor y personaje) no rompe el guardado.
    const dupActors = [...baseBody(4).actors!, baseBody(4).actors![0]];
    await saveSeriesFromForm(
      series.id,
      { ...baseBody(4), actors: dupActors, seasons: undefined },
      IMAGE,
      'flor'
    );
    assert.equal(
      await prisma.seriesActor.count({ where: { seriesId: series.id } }),
      2
    );

    // 9. Curaduria no queda suscripta sola al empezar a seguir (reporte de
    // Flor del 27/09); una cuenta comun si.
    const [curator, reader] = await Promise.all([
      prisma.user.create({
        data: { email: `curator-${runId}@test.local`, role: 'ADMIN' },
      }),
      prisma.user.create({ data: { email: `reader-${runId}@test.local` } }),
    ]);
    try {
      await subscribeOnFirstTrack(prisma, curator.id, series.id);
      await subscribeOnFirstTrack(prisma, reader.id, series.id);
      const subscribed = await prisma.seriesSubscription.findMany({
        where: { seriesId: series.id },
        select: { userId: true },
      });
      assert.deepEqual(
        subscribed.map((row) => row.userId),
        [reader.id]
      );
    } finally {
      await prisma.user.deleteMany({
        where: { id: { in: [curator.id, reader.id] } },
      });
    }

    console.log(
      'PASS: no-op sin reescrituras, 409 por pestaña vieja y sin version, diff de etiquetas, historial, atomicidad, concurrencia, reparto repetido y curaduria sin auto-suscripcion.'
    );
  } finally {
    await prisma.seriesRevision.deleteMany({
      where: { seriesId: { in: seriesIds } },
    });
    await prisma.relatedSeries.deleteMany({
      where: {
        OR: [
          { mainSeriesId: { in: seriesIds } },
          { relatedSeriesId: { in: seriesIds } },
        ],
      },
    });
    await prisma.series.deleteMany({ where: { id: { in: seriesIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
