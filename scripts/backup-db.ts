import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// All models to backup, in order that respects foreign keys
const MODELS = [
  {
    name: 'User',
    delegate: (client: Prisma.TransactionClient) => client.user.findMany(),
  },
  {
    name: 'Account',
    delegate: (client: Prisma.TransactionClient) => client.account.findMany(),
  },
  {
    name: 'Session',
    delegate: (client: Prisma.TransactionClient) => client.session.findMany(),
  },
  {
    name: 'VerificationToken',
    delegate: (client: Prisma.TransactionClient) =>
      client.verificationToken.findMany(),
  },
  {
    name: 'Universe',
    delegate: (client: Prisma.TransactionClient) => client.universe.findMany(),
  },
  {
    name: 'ProductionCompany',
    delegate: (client: Prisma.TransactionClient) =>
      client.productionCompany.findMany(),
  },
  {
    name: 'Language',
    delegate: (client: Prisma.TransactionClient) => client.language.findMany(),
  },
  {
    name: 'Country',
    delegate: (client: Prisma.TransactionClient) => client.country.findMany(),
  },
  {
    name: 'Genre',
    delegate: (client: Prisma.TransactionClient) => client.genre.findMany(),
  },
  {
    name: 'Tag',
    delegate: (client: Prisma.TransactionClient) => client.tag.findMany(),
  },
  {
    name: 'Series',
    delegate: (client: Prisma.TransactionClient) => client.series.findMany(),
  },
  {
    name: 'SeriesProductionCompany',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesProductionCompany.findMany(),
  },
  {
    name: 'PersonEnrichment',
    delegate: (client: Prisma.TransactionClient) =>
      client.personEnrichment.findMany(),
  },
  {
    name: 'SupportThread',
    delegate: (client: Prisma.TransactionClient) =>
      client.supportThread.findMany(),
  },
  {
    name: 'SupportMessage',
    delegate: (client: Prisma.TransactionClient) =>
      client.supportMessage.findMany(),
  },
  {
    name: 'Season',
    delegate: (client: Prisma.TransactionClient) => client.season.findMany(),
  },
  {
    name: 'Episode',
    delegate: (client: Prisma.TransactionClient) => client.episode.findMany(),
  },
  {
    name: 'Actor',
    delegate: (client: Prisma.TransactionClient) => client.actor.findMany(),
  },
  {
    name: 'Director',
    delegate: (client: Prisma.TransactionClient) => client.director.findMany(),
  },
  {
    name: 'SeriesActor',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesActor.findMany(),
  },
  {
    name: 'SeasonActor',
    delegate: (client: Prisma.TransactionClient) =>
      client.seasonActor.findMany(),
  },
  {
    name: 'SeriesDirector',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesDirector.findMany(),
  },
  {
    name: 'SeriesGenre',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesGenre.findMany(),
  },
  {
    name: 'SeriesTag',
    delegate: (client: Prisma.TransactionClient) => client.seriesTag.findMany(),
  },
  {
    name: 'SeriesDubbing',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesDubbing.findMany(),
  },
  {
    name: 'RelatedSeries',
    delegate: (client: Prisma.TransactionClient) =>
      client.relatedSeries.findMany(),
  },
  {
    name: 'Rating',
    delegate: (client: Prisma.TransactionClient) => client.rating.findMany(),
  },
  {
    name: 'UserRating',
    delegate: (client: Prisma.TransactionClient) =>
      client.userRating.findMany(),
  },
  {
    name: 'Comment',
    delegate: (client: Prisma.TransactionClient) => client.comment.findMany(),
  },
  {
    name: 'UserFavorite',
    delegate: (client: Prisma.TransactionClient) =>
      client.userFavorite.findMany(),
  },
  {
    name: 'ViewStatus',
    delegate: (client: Prisma.TransactionClient) =>
      client.viewStatus.findMany(),
  },
  {
    name: 'FeatureRequest',
    delegate: (client: Prisma.TransactionClient) =>
      client.featureRequest.findMany(),
  },
  {
    name: 'FeatureRequestImage',
    delegate: (client: Prisma.TransactionClient) =>
      client.featureRequestImage.findMany(),
  },
  {
    name: 'FeatureVote',
    delegate: (client: Prisma.TransactionClient) =>
      client.featureVote.findMany(),
  },
  {
    name: 'AccessLog',
    delegate: (client: Prisma.TransactionClient) => client.accessLog.findMany(),
  },
  {
    name: 'BannedIp',
    delegate: (client: Prisma.TransactionClient) => client.bannedIp.findMany(),
  },
  {
    name: 'RecommendedSite',
    delegate: (client: Prisma.TransactionClient) =>
      client.recommendedSite.findMany(),
  },
  {
    name: 'SuggestedSite',
    delegate: (client: Prisma.TransactionClient) =>
      client.suggestedSite.findMany(),
  },
  {
    name: 'WatchLink',
    delegate: (client: Prisma.TransactionClient) => client.watchLink.findMany(),
  },
  {
    name: 'EmbeddableContent',
    delegate: (client: Prisma.TransactionClient) =>
      client.embeddableContent.findMany(),
  },
  {
    name: 'GlossaryTerm',
    delegate: (client: Prisma.TransactionClient) =>
      client.glossaryTerm.findMany(),
  },
  {
    name: 'GlossaryTermTag',
    delegate: (client: Prisma.TransactionClient) =>
      client.glossaryTermTag.findMany(),
  },
  {
    name: 'GlossarySuggestion',
    delegate: (client: Prisma.TransactionClient) =>
      client.glossarySuggestion.findMany(),
  },
  {
    name: 'News',
    delegate: (client: Prisma.TransactionClient) => client.news.findMany(),
  },
  {
    name: 'NewsTag',
    delegate: (client: Prisma.TransactionClient) => client.newsTag.findMany(),
  },
  {
    name: 'ChangelogItem',
    delegate: (client: Prisma.TransactionClient) =>
      client.changelogItem.findMany(),
  },
  {
    name: 'Announcement',
    delegate: (client: Prisma.TransactionClient) =>
      client.announcement.findMany(),
  },
  {
    name: 'AnnouncementRecipient',
    delegate: (client: Prisma.TransactionClient) =>
      client.announcementRecipient.findMany(),
  },
  {
    name: 'Review',
    delegate: (client: Prisma.TransactionClient) => client.review.findMany(),
  },
  {
    name: 'ReviewVote',
    delegate: (client: Prisma.TransactionClient) =>
      client.reviewVote.findMany(),
  },
  {
    name: 'SeriesInfoBlock',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesInfoBlock.findMany(),
  },
  {
    name: 'SeriesNote',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesNote.findMany(),
  },
  {
    name: 'EpisodeNote',
    delegate: (client: Prisma.TransactionClient) =>
      client.episodeNote.findMany(),
  },
  {
    name: 'SeriesSubscription',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesSubscription.findMany(),
  },
  {
    name: 'SeriesSuggestion',
    delegate: (client: Prisma.TransactionClient) =>
      client.seriesSuggestion.findMany(),
  },
  {
    name: 'FeatureRequestComment',
    delegate: (client: Prisma.TransactionClient) =>
      client.featureRequestComment.findMany(),
  },
  {
    name: 'CommentReport',
    delegate: (client: Prisma.TransactionClient) =>
      client.commentReport.findMany(),
  },
  {
    name: 'Notification',
    delegate: (client: Prisma.TransactionClient) =>
      client.notification.findMany(),
  },
  {
    name: 'NotificationPrefs',
    delegate: (client: Prisma.TransactionClient) =>
      client.notificationPrefs.findMany(),
  },
  {
    name: 'PushSubscription',
    delegate: (client: Prisma.TransactionClient) =>
      client.pushSubscription.findMany(),
  },
  {
    name: 'UserDashboardLayout',
    delegate: (client: Prisma.TransactionClient) =>
      client.userDashboardLayout.findMany(),
  },
  {
    name: 'EmbedPreviewCache',
    delegate: (client: Prisma.TransactionClient) =>
      client.embedPreviewCache.findMany(),
  },
];

async function main() {
  const schema = fs.readFileSync(
    path.join(__dirname, '..', 'prisma', 'schema.prisma'),
    'utf8'
  );
  const schemaModels = [...schema.matchAll(/^model (\w+)\s*\{/gm)]
    .map((match) => match[1])
    .sort();
  const backupModels = MODELS.map((model) => model.name).sort();
  if (JSON.stringify(schemaModels) !== JSON.stringify(backupModels)) {
    throw new Error(
      'Backup incompleto: actualizar MODELS para incluir todos los modelos del schema.'
    );
  }
  if (process.argv.includes('--check-models')) {
    console.log(`Cobertura correcta: ${schemaModels.length} modelos.`);
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL.');
  const backupDir =
    process.env.BACKUP_OUTPUT_DIR || path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(backupDir, `mundobl_${timestamp}.json`);

  console.log('Iniciando backup...\n');

  const backup: Record<string, unknown[]> = {};
  let totalRecords = 0;
  await prisma.$transaction(
    async (transaction) => {
      for (const model of MODELS) {
        const data = await model.delegate(transaction);
        backup[model.name] = data;
        totalRecords += data.length;
        console.log(`  ${model.name}: ${data.length} registros`);
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      timeout: 600_000,
    }
  );

  if (totalRecords === 0) {
    console.error('\nBACKUP ABORTADO: la base devolvio 0 registros.');
    console.error('  Revisa DATABASE_URL. No se escribio ningun archivo.');
    process.exitCode = 1;
    return;
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
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
