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
      import { StatsClient } from './src/app/(app)/admin/stats/StatsClient';
      import './src/styles/variables.css';
      const data = {
        generatedAt:'2026-09-27T12:00:00Z',
        summary:{totalSeries:10,totalPublicComments:0,totalPublishedReviews:3,totalCompletedViews:0,totalCurrentlyWatching:0,totalFavorites:0,totalActors:0,totalDirectors:0,averageCommunityRating:null,totalUserRatings:0,teamCompletedSeries:0},
        rankings:{topSeries:[],topFavorited:[],topActors:[],topDirectors:[],topProductionCompanies:[],topCountries:[],byType:[]},
        catalog:{byCountry:[],byType:[],byGenre:[],byYear:[]}, ratings:{averageCommunity:null,total:0,distribution:[]}
      };
      createRoot(document.getElementById('root')).render(<LocaleProvider>{location.pathname==='/admin' ? <StatsClient/> : <PublicStatsClient initialData={data}/>}</LocaleProvider>);
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  plugins: [
    {
      name: 'framework-fixtures',
      setup(b) {
        b.onResolve(
          { filter: /^(next\/navigation|next-auth\/react)$|\/AdminNav$/ },
          (args) => ({ path: args.path, namespace: 'fixture' })
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents:
            args.path === 'next/navigation'
              ? 'export const useRouter=()=>({push(){}}); export const usePathname=()=>"/estadisticas";'
              : args.path === 'next-auth/react'
                ? 'export const useSession=()=>({data:null,status:"unauthenticated"});'
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
await page.route('**/api/admin/stats', (route) =>
  route.fulfill({
    json: {
      summary: {
        totalUsers: 1,
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
  assert.deepEqual(errors, []);
  console.log(
    'PASS: public/admin review cards, review-only user, desktop/mobile without overflow'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
