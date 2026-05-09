-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "embedChannelName" TEXT,
ADD COLUMN     "embedChannelUrl" TEXT,
ADD COLUMN     "embedPlatform" TEXT,
ADD COLUMN     "embedUrl" TEXT,
ADD COLUMN     "embedVideoId" TEXT;

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "catalogScope" TEXT NOT NULL DEFAULT 'PERSONAL';
