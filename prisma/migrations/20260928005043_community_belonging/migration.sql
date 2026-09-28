BEGIN;

-- CreateEnum
CREATE TYPE "CommunityVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "RecommendationListKind" AS ENUM ('STANDARD', 'TOP_FIVE');

-- CreateEnum
CREATE TYPE "CommunityPromptChoice" AS ENUM ('NEW', 'LATER', 'DISMISSED', 'STARTED');

-- CreateEnum
CREATE TYPE "CommunityReportTarget" AS ENUM ('TOPIC', 'REPLY', 'LIST', 'PROFILE');

-- CreateEnum
CREATE TYPE "CommunityReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'SPOILERS', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CommunityModerationKind" AS ENUM ('HIDE', 'RESTORE', 'RESOLVE', 'DISMISS');

-- AlterTable
ALTER TABLE "CommunityReply" ADD COLUMN     "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recommendedSeriesId" INTEGER;

-- AlterTable
ALTER TABLE "CommunityTopic" ADD COLUMN     "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PRIVATE';

-- Preserve the explicit publication of existing conversations. New ones default private.
UPDATE "CommunityTopic" SET "visibility" = 'PUBLIC';

-- CreateTable
CREATE TABLE "CommunityProfile" (
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "showAvatar" BOOLEAN NOT NULL DEFAULT false,
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "promptChoice" "CommunityPromptChoice" NOT NULL DEFAULT 'NEW',
    "promptAfter" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RecommendationList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" "RecommendationListKind" NOT NULL DEFAULT 'STANDARD',
    "visibility" "CommunityVisibility" NOT NULL DEFAULT 'PRIVATE',
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "RecommendationList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecommendationListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityFollow" (
    "userId" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFollow_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "CommunityBlock" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityBlock_pkey" PRIMARY KEY ("userId","targetId")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "targetType" "CommunityReportTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "CommunityReportReason" NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "status" "CommunityReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityModerationAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "moderatorId" TEXT,
    "action" "CommunityModerationKind" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunitySettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "conversationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "listsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "profilesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promptEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunitySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityProfile_publicId_key" ON "CommunityProfile"("publicId");

-- CreateIndex
CREATE INDEX "RecommendationList_userId_updatedAt_idx" ON "RecommendationList"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "RecommendationList_visibility_moderationHidden_publishedAt_idx" ON "RecommendationList"("visibility", "moderationHidden", "publishedAt");

-- CreateIndex
CREATE INDEX "RecommendationListItem_seriesId_idx" ON "RecommendationListItem"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationListItem_listId_seriesId_key" ON "RecommendationListItem"("listId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationListItem_listId_position_key" ON "RecommendationListItem"("listId", "position");

-- CreateIndex
CREATE INDEX "CommunityFollow_topicId_notify_muted_idx" ON "CommunityFollow"("topicId", "notify", "muted");

-- CreateIndex
CREATE INDEX "CommunityBlock_targetId_idx" ON "CommunityBlock"("targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReport_reporterId_targetType_targetId_key" ON "CommunityReport"("reporterId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityModerationAction_reportId_createdAt_idx" ON "CommunityModerationAction"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_visibility_moderationHidden_createdAt_idx" ON "CommunityTopic"("visibility", "moderationHidden", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_recommendedSeriesId_fkey" FOREIGN KEY ("recommendedSeriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityProfile" ADD CONSTRAINT "CommunityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationList" ADD CONSTRAINT "RecommendationList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationListItem" ADD CONSTRAINT "RecommendationListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "RecommendationList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationListItem" ADD CONSTRAINT "RecommendationListItem_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFollow" ADD CONSTRAINT "CommunityFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFollow" ADD CONSTRAINT "CommunityFollow_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBlock" ADD CONSTRAINT "CommunityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBlock" ADD CONSTRAINT "CommunityBlock_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityModerationAction" ADD CONSTRAINT "CommunityModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CommunityReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityModerationAction" ADD CONSTRAINT "CommunityModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecommendationList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecommendationListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityFollow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityModerationAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunitySettings" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX "RecommendationList_one_top_five" ON "RecommendationList" ("userId") WHERE "kind" = 'TOP_FIVE';
ALTER TABLE "RecommendationListItem" ADD CONSTRAINT "RecommendationListItem_position_check" CHECK ("position" >= 0 AND "position" < 100);
ALTER TABLE "CommunityBlock" ADD CONSTRAINT "CommunityBlock_no_self" CHECK ("userId" <> "targetId");
ALTER TABLE "CommunitySettings" ADD CONSTRAINT "CommunitySettings_singleton" CHECK ("id" = 1);
COMMIT;
