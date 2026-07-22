/**
 * Detecta series CURATED duplicadas por título (case-insensitive).
 *
 * Contexto: no hay unique constraint en Series.title (CURATED y USER_EMBED
 * comparten título a propósito), y hasta ahora los endpoints de alta no
 * deduplicaban. Esto generaba filas gemelas CURATED que Flor ve en /admin/series
 * y que "no se pueden borrar" (borra una, queda la otra).
 *
 * El alta ahora rechaza duplicados (409), pero los que ya existen hay que
 * revisarlos a mano. Este script es READ-ONLY: solo lista los grupos duplicados
 * con sus ids, año y conteo de temporadas/episodios para decidir cuál conservar
 * y cuál borrar desde el admin.
 *
 *   npx tsx scripts/find-duplicate-series.ts
 */
import { prisma } from '../src/lib/database';

async function main() {
  const series = await prisma.series.findMany({
    where: { origin: 'CURATED' },
    select: {
      id: true,
      title: true,
      year: true,
      createdAt: true,
      imageUrl: true,
      _count: { select: { seasons: true } },
    },
    orderBy: { title: 'asc' },
  });

  const groups = new Map<string, typeof series>();
  for (const s of series) {
    const key = s.title.trim().toLowerCase();
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  const dupes = [...groups.values()].filter((g) => g.length > 1);

  if (dupes.length === 0) {
    console.log('✅ Sin series CURATED duplicadas por título.');
    return;
  }

  console.log(`⚠️  ${dupes.length} título(s) con duplicados CURATED:\n`);
  for (const group of dupes) {
    console.log(`— "${group[0].title}"`);
    for (const s of group) {
      console.log(
        `    id=${s.id}  year=${s.year ?? '?'}  temporadas=${s._count.seasons}  ` +
          `img=${s.imageUrl ? 'sí' : 'no'}  creada=${s.createdAt.toISOString().slice(0, 10)}`
      );
    }
    console.log('');
  }
  console.log(
    'Revisá cada grupo y borrá las gemelas sobrantes desde /admin/series ' +
      '(conservá la que tenga más temporadas/imagen).'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
