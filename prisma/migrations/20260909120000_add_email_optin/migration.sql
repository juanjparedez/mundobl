-- AlterTable
ALTER TABLE "NotificationPrefs" ADD COLUMN     "emailEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailSentCount" INTEGER;
