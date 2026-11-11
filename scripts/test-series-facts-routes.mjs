import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Ruta real + SQL real; solo se simula la sesion.
const require = createRequire(import.meta.url);
const database = require('../src/lib/database.ts');
const { assertLocalTestDatabase } = require('./assert-local-test-database.ts');
const { resolveFacts } = require('../src/lib/series-facts.ts');
assertLocalTestDatabase();

// Consenso: 3 que coinciden y 2/3 de los votos; empate no muestra nada.
const votes = (rows) => resolveFacts(rows, []);
assert.equal(
  votes([{ fact: 'kiss', value: 'yes', count: 2 }]).kiss.value,
  null
);
assert.equal(
  votes([{ fact: 'kiss', value: 'yes', count: 3 }]).kiss.value,
  'yes'
);
assert.equal(
  votes([
    { fact: 'kiss', value: 'yes', count: 3 },
    { fact: 'kiss', value: 'none', count: 2 },
  ]).kiss.value,
  null,
  '3 of 5 is under two thirds'
);
assert.equal(
  votes([
    { fact: 'kiss', value: 'yes', count: 4 },
    { fact: 'kiss', value: 'none', count: 4 },
  ]).kiss.value,
  null
);
assert.equal(
  votes([{ fact: 'kiss', value: 'nope', count: 9 }]).kiss.value,
  null,
  'Unknown values never show'
);
const staff = resolveFacts(
  [{ fact: 'ending', value: 'sad', count: 5 }],
  [{ fact: 'ending', value: 'happy' }]
).ending;
assert.deepEqual(staff, { value: 'happy', source: 'staff', votes: 5 });

let session = null;
const authModule = { auth: async () => session };
const authHelpers = {
  requireAuth: async () =>
    !session?.user
      ? { authorized: false, response: Response.json({}, { status: 401 }) }
      : session.user.banned
        ? { authorized: false, response: Response.json({}, { status: 403 }) }
        : {
            authorized: true,
            userId: session.user.id,
            role: session.user.role,
          },
};
function loadRoute(path) {
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', compiled)((name) => {
    if (name === '@/lib/auth') return authModule;
    if (name === '@/lib/auth-helpers') return authHelpers;
    if (name === '@/lib/database') return database;
    if (name.startsWith('@/')) return require(`../src/${name.slice(2)}.ts`);
    return require(name);
  }, exports);
  return exports;
}
const route = loadRoute('src/app/api/series/[id]/facts/route.ts');
const { NextRequest } = require('next/server');
const { prisma } = database;
const key = `facts-route-${Date.now()}`;
const users = [1, 2, 3, 4].map((n) => `${key}-${n}`);
const as = (id, role = 'VISITOR', banned = false) => {
  session = { user: { id, role, banned } };
};

const params = (id) => ({ params: Promise.resolve({ id: String(id) }) });
const get = async (id) =>
  (await route.GET(new Request('http://localhost'), params(id))).json();
const post = (id, body, headers = {}) =>
  route.POST(
    new NextRequest(`http://localhost/api/series/${id}/facts`, {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    params(id)
  );

for (const id of users)
  await prisma.user.create({ data: { id, email: `${id}@example.invalid` } });
const series = await prisma.series.create({
  data: { title: key, type: 'serie' },
});
const hidden = await prisma.series.create({
  data: { title: `${key} hidden`, type: 'serie', visibility: 'HIDDEN' },
});
try {
  session = null;
  assert.equal(
    (await post(series.id, { fact: 'kiss', value: 'yes' })).status,
    401
  );

  as(users[0]);
  assert.equal(
    (await post(series.id, { fact: 'kiss', value: 'yes' })).status,
    200
  );
  assert.equal(
    (await post(series.id, { fact: 'kiss', value: 'yes' })).status,
    200
  );
  let view = await get(series.id);
  assert.equal(view.facts.kiss.votes, 1, 'One vote per person and fact');
  assert.equal(view.mine.kiss, 'yes');
  assert.equal(view.facts.kiss.value, null);
  assert.equal(view.canEdit, false);

  as(users[1]);
  await post(series.id, { fact: 'kiss', value: 'yes' });
  as(users[2]);
  await post(series.id, { fact: 'kiss', value: 'yes' });
  view = await get(series.id);
  assert.deepEqual(view.facts.kiss, {
    value: 'yes',
    source: 'community',
    votes: 3,
  });
  assert.deepEqual(view.mine, { kiss: 'yes' });

  // Cambiar y borrar el voto.
  await post(series.id, { fact: 'kiss', value: 'several' });
  assert.equal((await get(series.id)).facts.kiss.value, null);
  await post(series.id, { fact: 'kiss', value: null });
  assert.equal((await get(series.id)).facts.kiss.votes, 2);

  // Entradas invalidas.
  assert.equal(
    (await post(series.id, { fact: 'kiss', value: 'shown' })).status,
    400
  );
  assert.equal(
    (await post(series.id, { fact: 'age', value: 'yes' })).status,
    400
  );
  assert.equal(
    (await post(hidden.id, { fact: 'kiss', value: 'yes' })).status,
    400
  );
  assert.equal(
    (
      await post(
        series.id,
        { fact: 'kiss', value: 'yes' },
        { origin: 'https://evil.example' }
      )
    ).status,
    403
  );
  assert.equal(
    (await post(series.id, { fact: 'ending', value: 'sad', official: true }))
      .status,
    403,
    'Only staff can set official facts'
  );
  as(users[3], 'VISITOR', true);
  assert.equal(
    (await post(series.id, { fact: 'kiss', value: 'yes' })).status,
    403
  );

  // El equipo fija el dato y gana; null vuelve al consenso.
  as(users[3], 'COLLABORATOR');
  assert.equal((await get(series.id)).canEdit, true);
  assert.equal(
    (await post(series.id, { fact: 'ending', value: 'happy', official: true }))
      .status,
    200
  );
  view = await get(series.id);
  assert.deepEqual(view.facts.ending, {
    value: 'happy',
    source: 'staff',
    votes: 0,
  });
  assert.equal(view.mine.ending, undefined, 'Official is not a personal vote');
  await post(series.id, { fact: 'ending', value: null, official: true });
  assert.equal((await get(series.id)).facts.ending.value, null);
  console.log('series facts routes ok');
} finally {
  await prisma.series.deleteMany({
    where: { id: { in: [series.id, hidden.id] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
}
