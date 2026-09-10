/* eslint-disable no-console */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

/**
 * Rellena `Episode.airDate` desde el `publishedAt` del video de YouTube.
 *
 * Por que importa: medido el 2026-09-10, `airDate` estaba vacio en los
 * 6.920 episodios de la base, aunque la YouTube Data API ya devuelve esa
 * fecha y el dato pasaba por el importador sin que lo guardaramos. Sin
 * `airDate` no hay forma de armar un calendario semanal de estrenos, que
 * es el gancho de retorno natural de este fandom: las series tailandesas
 * se emiten semanalmente y hoy no le avisamos a nadie cuando sale un
 * capitulo nuevo.
 *
 * `publishedAt` es la mejor aproximacion disponible a la fecha de emision:
 * los canales oficiales (GMMTV, Idol Factory, Mandee) suben cada capitulo
 * el mismo dia que sale al aire. Para catalogo historico subido de golpe
 * años despues la fecha no es la de emision real, pero para las series en
 * emision — que son las que traen gente de vuelta — es fiel.
 *
 * NUNCA pisa un `airDate` existente: solo toca los que estan en null.
 *
 * Ejecucion (dry-run por defecto porque DATABASE_URL apunta a produccion):
 *   npx tsx scripts/backfill-episode-airdate.ts
 *   npx tsx scripts/backfill-episode-airdate.ts --apply
 *   npx tsx scripts/backfill-episode-airdate.ts --apply --limit 200
 *
 * Alcance real (medido 2026-09-10): de los 6.920 episodios, solo 1.834
 * tienen embed, y los 1.834 son de YouTube con `embedVideoId` cargado. Los
 * 5.086 restantes son fichas de episodio sin video, asi que no hay de donde
 * sacarles la fecha. El techo de este backfill es ese 26%, que igual cubre
 * justo lo que se puede mirar — que es lo que le importa al calendario.
 *
 * Costo de cuota: batchea de a 50 ids por llamada, 1 unidad cada una. Los
 * 1.834 salen por ~37 unidades de las 10.000 diarias.
 */

const API_BATCH = 50;

// Las escrituras van en transacciones de a WRITE_BATCH en vez de un update
// suelto por episodio: el pooler de Supabase esta en sa-east-1 y de a una
// el backfill paga un round-trip de egress por fila, que es justo el costo
// que el proyecto viene bajando a mano.
const WRITE_BATCH = 100;

const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

function parseLimit(argv: string[]): number | null {
  const idx = argv.indexOf('--limit');
  if (idx === -1) return null;
  const raw = Number(argv[idx + 1]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.floor(raw);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limit = parseLimit(process.argv);
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('❌ Falta YOUTUBE_API_KEY.');
    process.exit(1);
  }

  const { prisma } = await import('../src/lib/database');
  const { parseAirDate } = await import('../src/lib/episode-parser');

  const eps = await prisma.episode.findMany({
    where: {
      airDate: null,
      embedVideoId: { not: null },
      embedPlatform: 'YouTube',
    },
    select: {
      id: true,
      episodeNumber: true,
      embedVideoId: true,
      season: { select: { series: { select: { id: true, title: true } } } },
    },
    orderBy: { id: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  if (eps.length === 0) {
    console.log('No hay episodios de YouTube sin airDate. Nada que hacer.');
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Revisando ${eps.length} episodios sin airDate${apply ? '' : ' [DRY RUN, no escribe]'}\n`
  );

  // ── Paso 1: pedir publishedAt a la API en lotes de 50 ──────────────
  const publicados = new Map<string, string>();
  for (let i = 0; i < eps.length; i += API_BATCH) {
    const ids = eps
      .slice(i, i + API_BATCH)
      .map((e) => e.embedVideoId!)
      .join(',');
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${apiKey}`
    );
    if (!res.ok) {
      console.error(`❌ API respondio ${res.status}: ${await res.text()}`);
      process.exit(1);
    }
    const data = (await res.json()) as {
      items?: Array<{ id: string; snippet: { publishedAt: string } }>;
    };
    for (const item of data.items ?? []) {
      publicados.set(item.id, item.snippet.publishedAt);
    }
  }

  // ── Paso 2: escribir ───────────────────────────────────────────────
  let ok = 0;
  let missing = 0;
  let invalid = 0;
  const porSerie = new Map<string, number>();
  const porDia = new Map<number, number>();
  let pendientes: Array<{ id: number; airDate: Date }> = [];

  async function flush() {
    if (!apply || pendientes.length === 0) return;
    await prisma.$transaction(
      pendientes.map((p) =>
        prisma.episode.update({
          where: { id: p.id },
          data: { airDate: p.airDate },
        })
      )
    );
    process.stdout.write(`  escritos ${ok}\r`);
    pendientes = [];
  }

  for (const ep of eps) {
    const publishedAt = publicados.get(ep.embedVideoId!);
    if (!publishedAt) {
      // El video ya no existe en YouTube: no inventamos una fecha. Que lo
      // agarre scripts/audit-ver-playability.ts y lo marque REMOVED.
      missing++;
      continue;
    }
    const airDate = parseAirDate(publishedAt);
    if (!airDate) {
      invalid++;
      continue;
    }

    porSerie.set(
      ep.season.series.title,
      (porSerie.get(ep.season.series.title) ?? 0) + 1
    );
    porDia.set(airDate.getDay(), (porDia.get(airDate.getDay()) ?? 0) + 1);

    pendientes.push({ id: ep.id, airDate });
    ok++;
    if (pendientes.length >= WRITE_BATCH) await flush();
  }
  await flush();

  // ── Resumen ────────────────────────────────────────────────────────
  console.log('=== TOP SERIES ===');
  for (const [serie, n] of [...porSerie]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)) {
    console.log(`  ${serie.slice(0, 44).padEnd(46)} ${n}`);
  }

  // Util para el calendario: si la distribucion por dia es plana, las
  // fechas son de subida masiva de catalogo historico y no de emision
  // semanal. Si se concentra en uno o dos dias, hay ritmo semanal real.
  console.log('\n=== DISTRIBUCION POR DIA DE LA SEMANA ===');
  for (let d = 0; d < 7; d++) {
    const n = porDia.get(d) ?? 0;
    const barra = '█'.repeat(Math.round((n / Math.max(ok, 1)) * 40));
    console.log(`  ${DIAS[d].padEnd(10)} ${String(n).padStart(5)} ${barra}`);
  }

  console.log(
    `\n${apply ? 'Escritos' : 'Se escribirian'}: ${ok}. Sin video en YouTube: ${missing}. Fecha invalida: ${invalid}.`
  );
  if (!apply) {
    console.log('\nCorré de nuevo con --apply para escribir.');
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
