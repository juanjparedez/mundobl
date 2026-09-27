import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const path =
  'src/app/(app)/catalogo/carousel/CatalogCarouselView/CatalogCarouselView.tsx';
const categories = ['empty', 'single', 'universe', 'last'].map((id) => ({
  id,
  labelKey: id,
  icon: () => null,
  filter: () => id !== 'empty',
  preferUniverseGroups: id === 'universe',
}));
const mocks = {
  '@ant-design/icons': { InboxOutlined: () => null },
  '@/components/design-system': { EmptyState: () => null },
  '../CatalogCarouselRow/CatalogCarouselRow': {
    CatalogCarouselRow: () => null,
  },
  '../catalogCarouselCategories': {
    CATALOG_CAROUSEL_CATEGORIES: categories,
    CAROUSEL_ROW_MAX_ITEMS: 12,
  },
  '../../catalogGrouping': {
    groupIntoCatalogItems: (series) =>
      series.map((serie) => ({ type: 'universe', universoId: serie.id })),
  },
  './CatalogCarouselView.css': {},
};
const code = ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const exports = {};
new Function('require', 'exports', code)(
  (name) => (name in mocks ? mocks[name] : require(name)),
  exports
);

for (const order of [
  ['empty', 'single', 'universe', 'last'],
  ['empty', 'universe', 'single', 'last'],
]) {
  const calls = [];
  const render = (kind) => (item, index) => {
    calls.push({ kind, index });
    return null;
  };
  exports.CatalogCarouselView({
    series: Array.from({ length: 12 }, (_, id) => ({ id: String(id) })),
    favoriteIds: new Set(),
    isLoggedIn: true,
    orderedVisibleIds: order,
    renderSingleCard: render('single'),
    renderUniverseCard: render('universe'),
    categoryLabel: (key) => key,
    scrollPrevLabel: 'Previous',
    scrollNextLabel: 'Next',
    emptyTitle: 'Empty',
  });
  assert.equal(calls.length, 36, 'No cards removed to improve loading');
  assert.equal(calls.filter(({ index }) => index < 4).length, 4);
  assert.ok(
    calls.slice(12).every(({ index }) => index >= 4),
    'Later rows never request priority'
  );
  assert.equal(
    calls[0].kind,
    order[1],
    'First nonempty row follows user order'
  );
}
console.log(
  'PASS: 36 carousel cards retain content; only 4 request eager loading, including reordered universe rows.'
);
