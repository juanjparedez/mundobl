-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "linkedSeriesId" INTEGER;

-- CreateTable
CREATE TABLE "EmbedPreviewCache" (
    "videoId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbedPreviewCache_pkey" PRIMARY KEY ("videoId","platform")
);

-- CreateIndex
CREATE INDEX "EmbedPreviewCache_createdAt_idx" ON "EmbedPreviewCache"("createdAt");

-- CreateIndex
CREATE INDEX "Series_linkedSeriesId_idx" ON "Series"("linkedSeriesId");

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_linkedSeriesId_fkey" FOREIGN KEY ("linkedSeriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
