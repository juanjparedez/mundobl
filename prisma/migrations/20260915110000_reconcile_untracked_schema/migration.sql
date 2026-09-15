-- AlterTable
ALTER TABLE "Actor" ADD COLUMN     "funFacts" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "FeatureRequest" ADD COLUMN     "category" TEXT DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "NotificationPrefs" ADD COLUMN     "notifyAdminComments" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "airDays" TEXT;

-- CreateTable
CREATE TABLE "SeriesNote" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "SeriesNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesSuggestion" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesNote_userId_updatedAt_idx" ON "SeriesNote"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SeriesNote_seriesId_idx" ON "SeriesNote"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesNote_userId_seriesId_key" ON "SeriesNote"("userId", "seriesId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_seriesId_idx" ON "SeriesSuggestion"("seriesId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_userId_idx" ON "SeriesSuggestion"("userId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_status_idx" ON "SeriesSuggestion"("status");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey
ALTER TABLE "SeriesNote" ADD CONSTRAINT "SeriesNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesNote" ADD CONSTRAINT "SeriesNote_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSuggestion" ADD CONSTRAINT "SeriesSuggestion_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesSuggestion" ADD CONSTRAINT "SeriesSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Match the existing production RLS protection on new databases too.
ALTER TABLE "SeriesNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesSuggestion" ENABLE ROW LEVEL SECURITY;
