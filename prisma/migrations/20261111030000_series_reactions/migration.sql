-- CreateTable
CREATE TABLE "SeriesReactionCount" (
    "seriesId" INTEGER NOT NULL,
    "reaction" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesReactionCount_pkey" PRIMARY KEY ("seriesId","reaction")
);

-- AddForeignKey
ALTER TABLE "SeriesReactionCount" ADD CONSTRAINT "SeriesReactionCount_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only; no public PostgREST policy.
ALTER TABLE "SeriesReactionCount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesReactionCount" ADD CONSTRAINT "SeriesReactionCount_reaction_check" CHECK ("reaction" IN ('laugh', 'love', 'fire', 'cry', 'mindblown', 'clap', 'wow', 'hot', 'smirk', 'kiss'));
ALTER TABLE "SeriesReactionCount" ADD CONSTRAINT "SeriesReactionCount_count_check" CHECK ("count" >= 0);

-- Los "Me gusta" del boton viejo de /ver pasan a ser la reaccion corazon.
INSERT INTO "SeriesReactionCount" ("seriesId", "reaction", "count", "updatedAt")
SELECT "seriesId", 'love', SUM("count")::INTEGER, CURRENT_TIMESTAMP
FROM "SeriesActivityDaily"
WHERE "kind" = 'like'
GROUP BY "seriesId"
HAVING SUM("count") > 0;

-- Nuevo kind: apertura de la ficha /series/[id].
ALTER TABLE "SeriesActivityDaily" DROP CONSTRAINT "SeriesActivityDaily_kind_check";
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_kind_check" CHECK ("kind" IN ('view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on', 'open_ver', 'play_start', 'outbound_click', 'like', 'series_view'));
