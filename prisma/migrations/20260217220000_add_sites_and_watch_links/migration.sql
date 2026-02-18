-- CreateTable
CREATE TABLE "RecommendedSite" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendedSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchLink" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "WatchLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WatchLink" ADD CONSTRAINT "WatchLink_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
