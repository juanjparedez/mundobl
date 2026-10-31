import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { LocaleProvider } from './src/lib/providers/LocaleProvider';
      import { PublicStatsClient } from './src/app/(app)/estadisticas/PublicStatsClient';
      import { FavoriteButton } from './src/components/series/FavoriteButton/FavoriteButton';
      import { ProducerReport } from './src/components/content/ProducerReport/ProducerReport';
      import { PilotReport } from './src/components/content/PilotReport/PilotReport';
      import { StatsClient } from './src/app/(app)/admin/stats/StatsClient';
      import './src/styles/variables.css';
      const data = {
        generatedAt:'2026-09-27T12:00:00Z',
        watch:{windowDays:30,totals:{playStarts:3,completedPlays:1,completionRate:null,communityLikes:0,outboundClicks:0,playerVisits:2},playsByDay:[{day:'2026-09-27',starts:3,completions:1}],topSeries:[{seriesId:1,title:'Player fixture',href:'/ver/1',starts:3,completions:1}]},
        summary:{totalSeries:10,totalPublicComments:0,totalPublishedReviews:3,totalCompletedViews:0,totalCurrentlyWatching:0,totalFavorites:0,totalActors:0,totalDirectors:0,averageCommunityRating:null,totalUserRatings:0,teamCompletedSeries:0},
        rankings:{topSeries:[],topFavorited:[],topActors:[],topDirectors:[],topProductionCompanies:[],topCountries:[],byType:[]},
        catalog:{byCountry:[],byType:[],byGenre:[],byYear:[]}, ratings:{averageCommunity:null,total:0,distribution:[]},
        recent:{shortWindowDays:7,longWindowDays:30,totalMembers:40,trackingMembers:20,activeMembers:12,newMembers:4,episodesSeenRecently:9,browserChaptersRecently:6,completedRecently:2,publicCommentsRecently:1,ratingsRecently:3,
          watchingNow:[{seriesId:1,title:'Serie sintetica',count:5}],
          episodesByDay:[{day:'2026-09-26',count:0},{day:'2026-09-27',count:2}],
          topWatchers:[{rank:1,count:12,name:'Perfil publico',profileId:'p1'},{rank:2,count:4,name:null,profileId:null}]}
      };
      const report = {generatedAt:'2026-10-31T12:00:00Z', days:30,from:'2026-10-02',to:'2026-10-31',accounts:2,activeAccounts:1,chaptersBySource:{account:1,browser:2},totals:{chapters:3,views:2,wants:0,finishes:0,playStarts:3},alerts:{offers:0,clicks:0,activated:0},series:[],channels:[],countries:[],outbound:[]};
      createRoot(document.getElementById('root')).render(<LocaleProvider>{location.pathname==='/producer' ? <ProducerReport report={report}/> : location.pathname==='/pilot' ? <PilotReport generatedAt={report.generatedAt} rows={[]}/> : location.pathname==='/favorite' ? <FavoriteButton/> : location.pathname==='/admin' ? <StatsClient/> : <PublicStatsClient initialData={data}/>}</LocaleProvider>);
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  plugins: [
    {
      name: 'framework-fixtures',
      setup(b) {
        b.onResolve(
          {
            filter:
              /^(next\/navigation|next-auth\/react)$|\/AdminNav$|\/SeriesUserStatusProvider$/,
          },
          (args) => ({ path: args.path, namespace: 'fixture' })
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents:
            args.path === 'next/navigation'
              ? 'export const useRouter=()=>({push(){},refresh(){window.favoriteRefreshes=(window.favoriteRefreshes||0)+1}}); export const usePathname=()=>"/estadisticas";'
              : args.path === 'next-auth/react'
                ? 'export const useSession=()=>({data:null,status:location.pathname==="/favorite"?"authenticated":"unauthenticated"}); export const signIn=()=>{};'
                : args.path.endsWith('/SeriesUserStatusProvider')
                  ? 'export const useSeriesUserStatus=()=>({seriesId:1,favorite:false,loaded:true,version:0,refetch:async()=>{}});'
                  : 'export const AdminNav=()=>null;',
          loader: 'js',
        }));
      },
    },
  ],
  bundle: true,
  write: false,
  outdir: 'test-results/stats-bundle',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((f) => f.path.endsWith('.css')).text;
const server = createServer((req, res) => {
  res.setHeader(
    'Content-Type',
    req.url === '/bundle.js'
      ? 'text/javascript'
      : req.url === '/bundle.css'
        ? 'text/css'
        : 'text/html'
  );
  res.end(
    req.url === '/bundle.js'
      ? js
      : req.url === '/bundle.css'
        ? css
        : '<!doctype html><html data-theme="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><style>*{box-sizing:border-box}body{margin:0;background:var(--bg-base);color:var(--text-primary);font-family:sans-serif}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ locale: 'es-AR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let failStats = false;
let statsReads = 0;
await page.route('**/api/admin/stats', (route) =>
  failStats
    ? route.fulfill({ status: 500, json: { error: 'fixture' } })
    : route.fulfill({
        json: {
          generatedAt: new Date().toISOString(),
          summary: {
            totalUsers: ++statsReads,
            currentlyWatchingDistinct: 0,
            completedThisWeek: 0,
            commentsThisWeek: 0,
            totalPublishedReviews: 3,
            reviewsThisWeek: 1,
          },
          rankings: {
            watching: [],
            completed: [],
            favorited: [],
            commented: [],
            rated: [],
          },
          activeUsers: [
            {
              id: 'synthetic',
              name: 'Solo reseñas',
              email: 'synthetic@example.invalid',
              role: 'VISITOR',
              image: null,
              _count: { viewStatuses: 0 },
            },
          ],
        },
      })
);
try {
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/public', '/admin']) {
      await page.goto(`http://127.0.0.1:${server.address().port}${path}`);
      await page.getByText('Reseñas publicadas', { exact: true }).waitFor();
      const cards = page.locator(
        path === '/public' ? '.public-stats-kpi' : '.stats-summary-card'
      );
      assert.match(
        await cards
          .filter({
            has: page.getByText('Reseñas publicadas', { exact: true }),
          })
          .innerText(),
        /3/
      );
      if (path === '/admin') {
        await page.getByText('Solo reseñas', { exact: true }).waitFor();
        await page
          .getByText('Reseñas publicadas en los últimos 7 días', {
            exact: true,
          })
          .waitFor();
      } else {
        await page.getByText(/Los datos se renuevan/).waitFor();
        await page.getByText('Player fixture', { exact: true }).waitFor();
        assert.match(
          await page.locator('.watch-stats-panel__top-counts').innerText(),
          /3 inicios/
        );
        assert.match(
          await page
            .locator('.mb-stat-card')
            .filter({
              has: page.getByText('Finalizaciones / inicios', { exact: true }),
            })
            .innerText(),
          /—/
        );
        await page.getByText('Actividad reciente', { exact: true }).waitFor();
        await page
          .getByText('Ranking del mes: capítulos vistos', { exact: true })
          .waitFor();
        assert.match(
          await cards
            .filter({
              has: page.getByText('Miembros activos (30 días)', {
                exact: true,
              }),
            })
            .innerText(),
          /12/
        );
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${path} overflow at ${width}`
      );
      await page.screenshot({
        path: `test-results/community-stats-${path.slice(1)}-${width}.png`,
        fullPage: true,
      });
    }
  }
  failStats = true;
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await page
    .getByRole('alert')
    .filter({ hasText: 'No se pudo cargar el informe' })
    .waitFor();
  failStats = false;
  const readsBefore = statsReads;
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.ant-alert'));
  assert.equal(statsReads, readsBefore + 1);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/producer', '/pilot']) {
      await page.goto(`http://127.0.0.1:${server.address().port}${path}`);
      await page.getByText('Consultado:', { exact: false }).waitFor();
      await page
        .getByRole('button', { name: 'Actualizar', exact: true })
        .click();
      await page.waitForFunction(() => window.favoriteRefreshes === 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        ),
        `${path} overflow at ${width}`
      );
    }
  }
  await page.route('**/api/series/1/favorite', (route) =>
    route.fulfill({ json: { isFavorite: true } })
  );
  await page.goto(`http://127.0.0.1:${server.address().port}/favorite`);
  await page.getByRole('button').click();
  await page.waitForFunction(() => window.favoriteRefreshes === 1);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: public/admin review cards, review-only user, desktop/mobile without overflow'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
