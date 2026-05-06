-- CreateTable
CREATE TABLE "SeriesSubscription" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "SeriesSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesSubscription_seriesId_idx" ON "SeriesSubscription"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesSubscription_userId_seriesId_key" ON "SeriesSubscription"("userId", "seriesId");

-- AddForeignKey
ALTER TABLE "SeriesSubscription" ADD CONSTRAINT "SeriesSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSubscription" ADD CONSTRAINT "SeriesSubscription_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
