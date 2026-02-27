import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// All models to backup, in order that respects foreign keys
const MODELS = [
  { name: 'User', delegate: () => prisma.user.findMany() },
  { name: 'Account', delegate: () => prisma.account.findMany() },
  { name: 'Session', delegate: () => prisma.session.findMany() },
  {
    name: 'VerificationToken',
    delegate: () => prisma.verificationToken.findMany(),
  },
  { name: 'Universe', delegate: () => prisma.universe.findMany() },
  {
    name: 'ProductionCompany',
    delegate: () => prisma.productionCompany.findMany(),
  },
  { name: 'Language', delegate: () => prisma.language.findMany() },
  { name: 'Country', delegate: () => prisma.country.findMany() },
  { name: 'Genre', delegate: () => prisma.genre.findMany() },
  { name: 'Tag', delegate: () => prisma.tag.findMany() },
  { name: 'Series', delegate: () => prisma.series.findMany() },
  { name: 'Season', delegate: () => prisma.season.findMany() },
  { name: 'Episode', delegate: () => prisma.episode.findMany() },
  { name: 'Actor', delegate: () => prisma.actor.findMany() },
  { name: 'Director', delegate: () => prisma.director.findMany() },
  { name: 'SeriesActor', delegate: () => prisma.seriesActor.findMany() },
  { name: 'SeasonActor', delegate: () => prisma.seasonActor.findMany() },
  { name: 'SeriesDirector', delegate: () => prisma.seriesDirector.findMany() },
  { name: 'SeriesGenre', delegate: () => prisma.seriesGenre.findMany() },
  { name: 'SeriesTag', delegate: () => prisma.seriesTag.findMany() },
  { name: 'SeriesDubbing', delegate: () => prisma.seriesDubbing.findMany() },
  { name: 'RelatedSeries', delegate: () => prisma.relatedSeries.findMany() },
  { name: 'Rating', delegate: () => prisma.rating.findMany() },
  { name: 'UserRating', delegate: () => prisma.userRating.findMany() },
  { name: 'Comment', delegate: () => prisma.comment.findMany() },
  { name: 'UserFavorite', delegate: () => prisma.userFavorite.findMany() },
  { name: 'ViewStatus', delegate: () => prisma.viewStatus.findMany() },
  { name: 'FeatureRequest', delegate: () => prisma.featureRequest.findMany() },
  {
    name: 'FeatureRequestImage',
    delegate: () => prisma.featureRequestImage.findMany(),
  },
  { name: 'FeatureVote', delegate: () => prisma.featureVote.findMany() },
  { name: 'AccessLog', delegate: () => prisma.accessLog.findMany() },
  { name: 'BannedIp', delegate: () => prisma.bannedIp.findMany() },
  {
    name: 'RecommendedSite',
    delegate: () => prisma.recommendedSite.findMany(),
  },
  { name: 'SuggestedSite', delegate: () => prisma.suggestedSite.findMany() },
  { name: 'WatchLink', delegate: () => prisma.watchLink.findMany() },
  {
    name: 'EmbeddableContent',
    delegate: () => prisma.embeddableContent.findMany(),
  },
];

async function main() {
  const backupDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(backupDir, `mundobl_${timestamp}.json`);

  console.log('Iniciando backup...\n');

  const backup: Record<string, unknown[]> = {};
  let totalRecords = 0;

  for (const model of MODELS) {
    try {
      const data = await model.delegate();
      backup[model.name] = data;
      totalRecords += data.length;
      console.log(`  ${model.name}: ${data.length} registros`);
    } catch (error) {
      console.error(`  ${model.name}: ERROR - ${error}`);
      backup[model.name] = [];
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\nBackup completado:`);
  console.log(`  Archivo: ${filePath}`);
  console.log(`  Modelos: ${MODELS.length}`);
  console.log(`  Registros: ${totalRecords}`);
  console.log(`  Tamaño: ${sizeMB} MB`);

  // Limpiar backups viejos (mantener ultimos 10)
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('mundobl_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > 10) {
    const toDelete = files.slice(10);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(backupDir, file));
    }
    console.log(`  Eliminados ${toDelete.length} backup(s) antiguos`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
