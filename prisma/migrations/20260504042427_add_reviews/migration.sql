-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ReviewVerdict" AS ENUM ('RECOMMENDED', 'MIXED', 'SKIP');

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "verdict" "ReviewVerdict",
    "language" TEXT NOT NULL DEFAULT 'es',
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "plotRating" INTEGER,
    "chemistryRating" INTEGER,
    "ostRating" INTEGER,
    "castingRating" INTEGER,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_seriesId_status_publishedAt_idx" ON "Review"("seriesId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_seriesId_language_key" ON "Review"("userId", "seriesId", "language");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
