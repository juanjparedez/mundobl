-- AlterEnum
ALTER TYPE "AnnouncementAudience" ADD VALUE 'SPECIFIC_USERS';

-- CreateEnum
CREATE TYPE "AnnouncementSurface" AS ENUM ('BANNER', 'MODAL', 'TOAST');

-- CreateEnum
CREATE TYPE "AnnouncementTemplate" AS ENUM ('SIMPLE', 'FEATURE', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "surface" "AnnouncementSurface" NOT NULL DEFAULT 'BANNER',
ADD COLUMN     "template" "AnnouncementTemplate" NOT NULL DEFAULT 'SIMPLE';

-- CreateTable
CREATE TABLE "AnnouncementRecipient" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announcementId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnnouncementRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRecipient_announcementId_userId_key" ON "AnnouncementRecipient"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "AnnouncementRecipient_userId_idx" ON "AnnouncementRecipient"("userId");

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRecipient" ADD CONSTRAINT "AnnouncementRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
