-- Sondeo de reproducibilidad por episodio (ver src/lib/playability.ts).
-- Aditiva: no toca ni borra datos existentes.

-- CreateEnum
CREATE TYPE "EpisodePlayback" AS ENUM ('UNKNOWN', 'OK', 'GEO_BLOCKED', 'AGE_RESTRICTED', 'REMOVED', 'NOT_EMBEDDABLE');

-- AlterTable
ALTER TABLE "Episode"
  ADD COLUMN "playback" "EpisodePlayback" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "playbackCheckedAt" TIMESTAMP(3),
  ADD COLUMN "playbackBlockedMarkets" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Episode_playback_playbackCheckedAt_idx" ON "Episode"("playback", "playbackCheckedAt");
