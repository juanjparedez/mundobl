-- CreateTable
CREATE TABLE "EmbeddableContent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "videoId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "language" TEXT,
    "thumbnailUrl" TEXT,
    "channelName" TEXT,
    "channelUrl" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seriesId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddableContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmbeddableContent" ADD CONSTRAINT "EmbeddableContent_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
