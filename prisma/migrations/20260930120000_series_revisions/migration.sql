BEGIN;

-- AlterTable
ALTER TABLE "Series" ADD COLUMN "editVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SeriesRevision" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "editVersion" INTEGER NOT NULL,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesRevision_seriesId_createdAt_idx" ON "SeriesRevision"("seriesId", "createdAt");

ALTER TABLE "SeriesRevision" ENABLE ROW LEVEL SECURITY;

COMMIT;
