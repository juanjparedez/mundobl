-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('SIN_VER', 'VIENDO', 'VISTA', 'ABANDONADA', 'RETOMAR');

-- Add new status column with default
ALTER TABLE "ViewStatus" ADD COLUMN "status" "WatchStatus" NOT NULL DEFAULT 'SIN_VER';

-- Migrate existing data: currentlyWatching=true takes priority over watched=true
UPDATE "ViewStatus" SET "status" = 'VIENDO' WHERE "currentlyWatching" = true;
UPDATE "ViewStatus" SET "status" = 'VISTA' WHERE "watched" = true AND "currentlyWatching" = false;

-- Drop old columns
ALTER TABLE "ViewStatus" DROP COLUMN "watched";
ALTER TABLE "ViewStatus" DROP COLUMN "currentlyWatching";
