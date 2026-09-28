-- CreateEnum
CREATE TYPE "CommunityTopicKind" AS ENUM ('DISCUSSION', 'REVIEW_REQUEST', 'RECOMMENDATION');

-- CreateTable
CREATE TABLE "CommunityTopic" (
    "id" SERIAL NOT NULL,
    "kind" "CommunityTopicKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "seriesId" INTEGER,
    "episodeId" INTEGER,

    CONSTRAINT "CommunityTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReply" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "CommunityReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityTopic_kind_createdAt_idx" ON "CommunityTopic"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_seriesId_createdAt_idx" ON "CommunityTopic"("seriesId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_episodeId_idx" ON "CommunityTopic"("episodeId");

-- CreateIndex
CREATE INDEX "CommunityTopic_userId_createdAt_idx" ON "CommunityTopic"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_topicId_createdAt_idx" ON "CommunityReply"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_userId_createdAt_idx" ON "CommunityReply"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityTopic" ADD CONSTRAINT "CommunityTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTopic" ADD CONSTRAINT "CommunityTopic_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityTopic" ADD CONSTRAINT "CommunityTopic_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Public access is served through authenticated application helpers, never PostgREST.
ALTER TABLE "CommunityTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityReply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityTopic" ADD CONSTRAINT "CommunityTopic_target_check" CHECK ((kind = 'RECOMMENDATION' OR "seriesId" IS NOT NULL) AND ("episodeId" IS NULL OR (kind = 'DISCUSSION' AND "seriesId" IS NOT NULL)));
