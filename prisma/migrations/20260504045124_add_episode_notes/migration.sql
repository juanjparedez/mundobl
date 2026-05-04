-- CreateTable
CREATE TABLE "EpisodeNote" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,

    CONSTRAINT "EpisodeNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpisodeNote_userId_updatedAt_idx" ON "EpisodeNote"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeNote_userId_episodeId_key" ON "EpisodeNote"("userId", "episodeId");

-- AddForeignKey
ALTER TABLE "EpisodeNote" ADD CONSTRAINT "EpisodeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeNote" ADD CONSTRAINT "EpisodeNote_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
