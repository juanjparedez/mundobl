-- AlterEnum
ALTER TYPE "WatchStatus" ADD VALUE 'QUIERO_VER';

-- AlterTable
ALTER TABLE "CommunityProfile" ADD COLUMN     "aliasSeed" INTEGER,
ADD COLUMN     "aliasUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SeriesActivityDaily" (
    "day" DATE NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SeriesActivityDaily_pkey" PRIMARY KEY ("day","seriesId","kind","source","country")
);

-- CreateIndex
CREATE INDEX "SeriesActivityDaily_seriesId_day_idx" ON "SeriesActivityDaily"("seriesId", "day");

-- AddForeignKey
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only aggregates; no public PostgREST policy.
ALTER TABLE "SeriesActivityDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_kind_check" CHECK ("kind" IN ('view', 'chapter', 'want', 'finish'));
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_source_check" CHECK ("source" IN ('account', 'browser'));
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_count_check" CHECK ("count" >= 0);
