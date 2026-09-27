import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let output;
const state = { failure: null };
function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((name) => {
    if (!(name in mocks)) throw new Error(name);
    return mocks[name];
  }, exports);
  return exports;
}
const { translateNewsToSpanish } = load('src/lib/news-translation.ts', {
  './gemini': {
    stripJsonFences: (s) => s,
    generateText: async (options) => {
      assert(options.signal instanceof AbortSignal);
      assert.equal(options.responseMimeType, 'application/json');
      for (const item of JSON.parse(options.prompt).items) {
        assert.deepEqual(Object.keys(item).sort(), ['id', 'summary', 'title']);
      }
      if (state.failure) throw state.failure;
      return JSON.stringify(output);
    },
  },
});
const inputs = [
  { title: 'Review', summary: 'English excerpt', florNotes: 'PRIVATE' },
  { title: '予告', summary: '原文' },
];
const row = (id) => ({
  id,
  language: 'es',
  title: 'Reseña',
  summary: 'Resumen en español.',
});
output = { items: [row(1), row(0)] };
assert.deepEqual(
  await translateNewsToSpanish(inputs),
  inputs.map(() => ({ title: 'Reseña', summary: 'Resumen en español.' }))
);
for (const bad of [
  null,
  {},
  { items: [row(0)] },
  { items: [row(0), row(0)] },
  { items: [row(0), { ...row(1), language: 'en' }] },
  { items: [row(0), { ...row(1), summary: '' }] },
]) {
  output = bad;
  await assert.rejects(translateNewsToSpanish(inputs));
}
state.failure = new Error('Timeout');
await assert.rejects(translateNewsToSpanish(inputs), /Timeout/);
assert.deepEqual(await translateNewsToSpanish([]), []);
const { isSeriesTrailer } = load('src/lib/news-topics.ts');
for (const title of [
  'Official Trailer Love',
  'ตัวอย่าง Love',
  'ทีเซอร์ Love',
  'Love 예고',
  'Love 티저',
  'Love 予告',
  'Love ティザー',
  'Love 預告',
  'Love 预告',
])
  assert(isSeriesTrailer(title), title);
for (const title of [
  'Official Trailer EP.3',
  'ตัวอย่าง ตอนที่ 2',
  'Love 第3話 予告',
  'Love 3회 예고',
  'Love OST teaser',
  'Interview',
])
  assert(!isSeriesTrailer(title), title);
console.warn(
  'News translation validation and multilingual trailer tests passed.'
);
