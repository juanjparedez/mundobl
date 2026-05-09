-- CreateTable
CREATE TABLE "SeriesInfoBlock" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "SeriesInfoBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesInfoBlock_seriesId_sortOrder_idx" ON "SeriesInfoBlock"("seriesId", "sortOrder");

-- AddForeignKey
ALTER TABLE "SeriesInfoBlock" ADD CONSTRAINT "SeriesInfoBlock_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
