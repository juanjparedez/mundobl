/* eslint-disable no-console */
import 'dotenv/config';
import { prisma } from '../src/lib/database';
import { ingestNews } from '../src/lib/news-ingest';

/**
 * Lo que traeria la ingesta de noticias hoy, sin escribir nada. Lee la base
 * (sitios recomendados, noticias existentes, series) y consulta los feeds y
 * YouTube (~24 unidades de cuota).
 *
 * Uso: npx tsx scripts/news-ingest-dry-run.ts
 */
async function main() {
  const result = await ingestNews({ dryRun: true });
  console.log(
    `fuentes=${result.sources} fallidas=${result.failedSources} candidatas=${result.candidates} nuevas=${result.preview.length}`
  );
  for (const item of result.preview) {
    console.log(
      `- [${item.source}]${item.seriesId ? ` (serie ${item.seriesId})` : ''} ${item.title}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
