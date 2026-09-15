-- One designated main story per universe, used as the catalog cover.
ALTER TABLE "Series" ADD COLUMN "isUniverseMain" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Series_one_main_story_per_universe"
ON "Series" ("universeId") WHERE "isUniverseMain" = true;
ALTER TABLE "Series" ADD CONSTRAINT "Series_main_story_requires_universe"
CHECK (NOT "isUniverseMain" OR "universeId" IS NOT NULL);
