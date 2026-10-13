import assert from 'node:assert/strict';
import {
  NAV_ITEMS,
  NAV_SECTIONS,
  canSeeNavItem,
  isNavItemActive,
} from '../src/components/layout/navItems';
import { getAppHistoryState } from '../src/lib/navigation-history';
import { getNavigationFallback } from '../src/lib/navigation-fallback';

const originalDestinations = [
  'community',
  'ver',
  'catalogo',
  'watching',
  'perfil',
  'notificaciones',
  'novedades',
  'estrenos',
  'actores',
  'directores',
  'guionistas',
  'productoras',
  'feedback',
  'sitios',
  'plataformas',
  'glosario',
  'contenido',
  'estadisticas',
  'acerca',
  'support',
  'admin',
  'colaborador',
];
assert.deepEqual(
  NAV_ITEMS.map((item) => item.key).sort(),
  originalDestinations.sort()
);
assert.equal(
  new Set(NAV_ITEMS.map((item) => item.path)).size,
  NAV_ITEMS.length
);
for (const role of [null, 'VISITOR', 'ADMIN', 'MODERATOR', 'COLLABORATOR']) {
  const visible = NAV_ITEMS.filter((item) =>
    canSeeNavItem(item, {
      loggedIn: role !== null,
      role,
      supportVisible: false,
    })
  );
  assert(!visible.some((item) => item.key === 'support'));
  assert.equal(
    visible.some((item) => item.key === 'admin'),
    role === 'ADMIN' || role === 'MODERATOR'
  );
  assert.equal(
    visible.some((item) => item.key === 'colaborador'),
    role === 'COLLABORATOR'
  );
  assert.equal(
    visible.some((item) => item.key === 'perfil'),
    role !== null
  );
  for (const item of visible)
    assert(NAV_SECTIONS.some((section) => section.key === item.section));
}
assert.deepEqual(
  NAV_ITEMS.filter((item) => item.section === 'people').map((item) => item.key),
  ['actores', 'directores', 'guionistas', 'productoras']
);
assert(
  isNavItemActive(
    NAV_ITEMS.find((item) => item.key === 'catalogo')!,
    '/series/103-titulo'
  )
);
assert(
  !isNavItemActive(NAV_ITEMS.find((item) => item.key === 'ver')!, '/version')
);
const state = {
  __NA: true,
  __PRIVATE_NEXTJS_INTERNALS_TREE: {},
  __mb_internal_back: true,
  __mb_page_scroll: { url: '/catalogo', y: 340 },
};
const replaced = getAppHistoryState(state);
assert.equal(replaced.__mb_internal_back, true);
assert.deepEqual(replaced.__mb_page_scroll, state.__mb_page_scroll);
assert(!('__NA' in replaced));
const pushed = getAppHistoryState(
  { __mb_fallback_entry: true, __mb_page_scroll: {} },
  'push'
);
assert.deepEqual(pushed, { __mb_internal_back: true });
for (const [path, fallback] of [
  ['/series/103-titulo', '/catalogo'],
  ['/actores/alguien', '/actores'],
  ['/ver/105-serie', '/ver'],
  ['/comunidad/listas/123', '/comunidad/listas'],
  ['/comunidad/perfiles/usuario', '/comunidad'],
  ['/admin/series/nueva', '/admin/series'],
  ['/admin/colaborador/123', '/admin/colaborador'],
  ['/admin/colaborador', '/ver'],
  ['/perfil/estadisticas', '/perfil'],
  ['/productoras', '/'],
])
  assert.equal(getNavigationFallback(path), fallback, path);
console.log(
  'Navigation: destinations, access, active sections, history metadata and fallbacks passed.'
);
