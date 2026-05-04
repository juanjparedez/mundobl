/*
  Warnings:

  - The `status` column on the `FeatureRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `priority` column on the `FeatureRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeatureRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "FeatureRequest" ADD COLUMN     "assignedToId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "FeatureRequestStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "priority",
ADD COLUMN     "priority" "FeatureRequestPriority" NOT NULL DEFAULT 'MEDIUM';

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
