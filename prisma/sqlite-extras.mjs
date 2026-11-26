// Reglas de la base que prisma/schema.prisma no puede expresar en SQLite:
// CHECKs, indices unicos parciales y el trigger del historial de seguimiento.
//
// Por que en un archivo aparte y no a mano en la migracion: cuando Prisma
// cambia una tabla en SQLite la vuelve a crear (CREATE "new_X", copia, DROP
// "X", RENAME). El DROP se lleva los triggers e indices que Prisma no conoce.
// scripts/d1-migration-new.mjs usa este archivo para volver a crearlos en
// cada migracion que recrea una de estas tablas, y scripts/test-d1-schema.mjs
// falla si alguno falta despues de aplicar todas las migraciones.
//
// SQLite no tiene ALTER TABLE ADD CONSTRAINT, asi que cada CHECK es un par de
// triggers BEFORE INSERT/UPDATE que abortan con el nombre de la regla (el
// mismo nombre que tenia el CHECK en Postgres).

/** Formato de fecha que escribe Prisma en SQLite/D1: 2026-11-26T03:46:50.123+00:00 */
export const SQL_NOW = `strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now')`;

const list = (values) => values.map((v) => `'${v}'`).join(', ');

const FACT_VALUES = {
  kiss: ['none', 'yes', 'several'],
  intimacy: ['none', 'implied', 'shown'],
  together: ['yes', 'no', 'open'],
  ending: ['happy', 'sad', 'bittersweet'],
  drama: ['light', 'medium', 'heavy'],
  sidecouple: ['yes', 'no'],
  triangle: ['yes', 'no'],
};
const factValueCheck = Object.entries(FACT_VALUES)
  .map(([fact, values]) => `(NEW."fact" = '${fact}' AND NEW."value" IN (${list(values)}))`)
  .join(' OR ');

/** [tabla, nombre, condicion que tiene que cumplir la fila NEW] */
export const CHECKS = [
  ['CommunitySettings', 'CommunitySettings_singleton', `NEW."id" = 1`],
  ['SupportSettings', 'SupportSettings_singleton', `NEW."id" = 1`],
  [
    'Series',
    'Series_main_story_requires_universe',
    `NOT NEW."isUniverseMain" OR NEW."universeId" IS NOT NULL`,
  ],
  [
    'Series',
    'Series_contentRating_check',
    `NEW."contentRating" IN (${list(['UNREVIEWED', 'GENERAL', 'ADULT18'])})`,
  ],
  [
    'Series',
    'Series_contentWarnings_check',
    `json_type(NEW."contentWarnings") = 'array' AND NOT EXISTS (SELECT 1 FROM json_each(NEW."contentWarnings") WHERE "value" NOT IN (${list(['SEX', 'NUDITY', 'VIOLENCE', 'ABUSE', 'SELF_HARM'])}))`,
  ],
  [
    'TrackingEvent',
    'TrackingEvent_one_target',
    `((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1`,
  ],
  [
    'CommunityTopic',
    'CommunityTopic_target_check',
    `(NEW."kind" = 'RECOMMENDATION' OR NEW."seriesId" IS NOT NULL) AND (NEW."episodeId" IS NULL OR (NEW."kind" = 'DISCUSSION' AND NEW."seriesId" IS NOT NULL))`,
  ],
  [
    'RecommendationListItem',
    'RecommendationListItem_position_check',
    `NEW."position" >= 0 AND NEW."position" < 100`,
  ],
  ['CommunityBlock', 'CommunityBlock_no_self', `NEW."userId" <> NEW."targetId"`],
  ['PilotClickDaily', 'PilotClickDaily_clicks_check', `NEW."clicks" >= 0`],
  [
    'PilotClickDaily',
    'PilotClickDaily_placement_check',
    `NEW."placement" IN (${list(['series', 'platforms'])})`,
  ],
  [
    'WatchLinkClickDaily',
    'WatchLinkClickDaily_surface_check',
    `NEW."surface" IN (${list(['series', 'info', 'watching'])})`,
  ],
  ['WatchLinkClickDaily', 'WatchLinkClickDaily_clicks_check', `NEW."clicks" >= 0`],
  [
    'SeriesActivityDaily',
    'SeriesActivityDaily_kind_check',
    `NEW."kind" IN (${list(['view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on', 'open_ver', 'play_start', 'outbound_click', 'like', 'series_view'])})`,
  ],
  [
    'SeriesActivityDaily',
    'SeriesActivityDaily_source_check',
    `NEW."source" IN (${list(['account', 'browser'])})`,
  ],
  ['SeriesActivityDaily', 'SeriesActivityDaily_count_check', `NEW."count" >= 0`],
  [
    'SiteTrafficDaily',
    'SiteTrafficDaily_section_check',
    `NEW."section" IN (${list(['home', 'catalogo', 'ver', 'ver_player', 'series_detail', 'estrenos', 'comunidad', 'estadisticas', 'perfil', 'otros'])})`,
  ],
  [
    'SiteTrafficDaily',
    'SiteTrafficDaily_flow_check',
    `NEW."flow" IN (${list(['direct', 'internal', 'referral', 'share'])})`,
  ],
  [
    'SiteTrafficDaily',
    'SiteTrafficDaily_source_check',
    `NEW."source" IN (${list(['account', 'browser'])})`,
  ],
  ['SiteTrafficDaily', 'SiteTrafficDaily_count_check', `NEW."count" >= 0`],
  [
    'SeriesReactionCount',
    'SeriesReactionCount_reaction_check',
    `NEW."reaction" IN (${list(['laugh', 'love', 'fire', 'cry', 'mindblown', 'clap', 'wow', 'hot', 'smirk', 'kiss'])})`,
  ],
  ['SeriesReactionCount', 'SeriesReactionCount_count_check', `NEW."count" >= 0`],
  ['SeriesFactVote', 'SeriesFactVote_fact_value_check', factValueCheck],
  ['SeriesFactOverride', 'SeriesFactOverride_fact_value_check', factValueCheck],
];

/** [tabla, nombre, SQL] de indices que el schema de Prisma no puede declarar. */
export const PARTIAL_INDEXES = [
  [
    'Series',
    'Series_one_main_story_per_universe',
    `CREATE UNIQUE INDEX IF NOT EXISTS "Series_one_main_story_per_universe" ON "Series" ("universeId") WHERE "isUniverseMain" = 1;`,
  ],
  [
    'RecommendationList',
    'RecommendationList_one_top_five',
    `CREATE UNIQUE INDEX IF NOT EXISTS "RecommendationList_one_top_five" ON "RecommendationList" ("userId") WHERE "kind" = 'TOP_FIVE';`,
  ],
];

// UUID v4 armado en SQL (SQLite no tiene gen_random_uuid).
const SQL_UUID = `lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))`;

const ONE_TARGET = `((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1`;
const NOT_RESTORING = `NOT EXISTS (SELECT 1 FROM "Lease" WHERE "key" = 'tracking-restore:' || NEW."userId" AND "expiresAt" > ${SQL_NOW})`;
const TARGET_CHANGED = `(OLD."userId" IS NOT NEW."userId" OR OLD."seriesId" IS NOT NEW."seriesId" OR OLD."seasonId" IS NOT NEW."seasonId" OR OLD."episodeId" IS NOT NEW."episodeId")`;

/**
 * Historial de seguimiento: misma logica que capture_tracking_event() en
 * Postgres (migracion 20260926192040_tracking_event_history).
 */
export const TRIGGERS = [
  [
    'ViewStatus',
    'ViewStatus_tracking_history_insert',
    `CREATE TRIGGER IF NOT EXISTS "ViewStatus_tracking_history_insert"
AFTER INSERT ON "ViewStatus"
WHEN NEW."userId" IS NOT NULL AND ${ONE_TARGET}
  AND NOT (NEW."status" = 'SIN_VER' AND NEW."watchedDate" IS NULL)
  AND ${NOT_RESTORING}
BEGIN
  INSERT INTO "TrackingEvent" ("id", "userId", "kind", "status", "previousStatus", "watchedDate", "previousWatchedDate", "recordedAt", "seriesId", "seasonId", "episodeId")
  VALUES (${SQL_UUID}, NEW."userId", 'RECORDED', NEW."status", NULL, NEW."watchedDate", NULL, ${SQL_NOW}, NEW."seriesId", NEW."seasonId", NEW."episodeId");
END;`,
  ],
  [
    'ViewStatus',
    'ViewStatus_tracking_history_update',
    `CREATE TRIGGER IF NOT EXISTS "ViewStatus_tracking_history_update"
AFTER UPDATE ON "ViewStatus"
WHEN NEW."userId" IS NOT NULL AND ${ONE_TARGET}
  AND (${TARGET_CHANGED} OR OLD."status" IS NOT NEW."status" OR OLD."watchedDate" IS NOT NEW."watchedDate")
  AND ${NOT_RESTORING}
BEGIN
  INSERT INTO "TrackingEvent" ("id", "userId", "kind", "status", "previousStatus", "watchedDate", "previousWatchedDate", "recordedAt", "seriesId", "seasonId", "episodeId")
  VALUES (
    ${SQL_UUID}, NEW."userId",
    CASE WHEN ${TARGET_CHANGED} THEN 'RECORDED' WHEN OLD."status" IS NOT NEW."status" THEN 'STATUS_CHANGED' ELSE 'DATE_CHANGED' END,
    NEW."status",
    CASE WHEN ${TARGET_CHANGED} THEN NULL ELSE OLD."status" END,
    NEW."watchedDate",
    CASE WHEN ${TARGET_CHANGED} THEN NULL ELSE OLD."watchedDate" END,
    ${SQL_NOW}, NEW."seriesId", NEW."seasonId", NEW."episodeId"
  );
END;`,
  ],
];

function checkTriggers([table, name, condition]) {
  return ['INSERT', 'UPDATE'].map(
    (op) => `CREATE TRIGGER IF NOT EXISTS "${name}_${op.toLowerCase()}"
BEFORE ${op} ON "${table}"
WHEN NOT (${condition})
BEGIN
  SELECT RAISE(ABORT, '${name}');
END;`
  );
}

/** Nombres de todos los objetos extra (para verificar que existan). */
export function extraObjectNames() {
  return [
    ...CHECKS.flatMap(([, name]) => [`${name}_insert`, `${name}_update`]),
    ...PARTIAL_INDEXES.map(([, name]) => name),
    ...TRIGGERS.map(([, name]) => name),
  ];
}

/** SQL que (re)crea los extras de las tablas pedidas, o de todas. */
export function renderExtras(tables) {
  const wanted = (table) => !tables || tables.includes(table);
  const parts = [
    ...CHECKS.filter(([t]) => wanted(t)).flatMap(checkTriggers),
    ...PARTIAL_INDEXES.filter(([t]) => wanted(t)).map(([, , sql]) => sql),
    ...TRIGGERS.filter(([t]) => wanted(t)).map(([, , sql]) => sql),
  ];
  return parts.length
    ? `\n-- Extras de prisma/sqlite-extras.mjs (CHECKs, indices parciales, triggers)\n${parts.join('\n\n')}\n`
    : '';
}

export const EXTRA_TABLES = [
  ...new Set([...CHECKS, ...PARTIAL_INDEXES, ...TRIGGERS].map(([t]) => t)),
];
