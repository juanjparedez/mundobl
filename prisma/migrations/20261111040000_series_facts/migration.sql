-- CreateTable
CREATE TABLE "SeriesFactVote" (
    "seriesId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesFactVote_pkey" PRIMARY KEY ("seriesId","userId","fact")
);

-- CreateTable
CREATE TABLE "SeriesFactOverride" (
    "seriesId" INTEGER NOT NULL,
    "fact" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "setById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeriesFactOverride_pkey" PRIMARY KEY ("seriesId","fact")
);

-- CreateIndex
CREATE INDEX "SeriesFactVote_userId_idx" ON "SeriesFactVote"("userId");

-- AddForeignKey
ALTER TABLE "SeriesFactVote" ADD CONSTRAINT "SeriesFactVote_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesFactVote" ADD CONSTRAINT "SeriesFactVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesFactOverride" ADD CONSTRAINT "SeriesFactOverride_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only; no public PostgREST policy.
ALTER TABLE "SeriesFactVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesFactOverride" ENABLE ROW LEVEL SECURITY;

-- Mismas claves y valores que SERIES_FACTS (src/lib/series-facts.ts).
ALTER TABLE "SeriesFactVote" ADD CONSTRAINT "SeriesFactVote_fact_value_check" CHECK (
  ("fact" = 'kiss' AND "value" IN ('none', 'yes', 'several')) OR
  ("fact" = 'intimacy' AND "value" IN ('none', 'implied', 'shown')) OR
  ("fact" = 'together' AND "value" IN ('yes', 'no', 'open')) OR
  ("fact" = 'ending' AND "value" IN ('happy', 'sad', 'bittersweet')) OR
  ("fact" = 'drama' AND "value" IN ('light', 'medium', 'heavy')) OR
  ("fact" = 'sidecouple' AND "value" IN ('yes', 'no')) OR
  ("fact" = 'triangle' AND "value" IN ('yes', 'no'))
);
ALTER TABLE "SeriesFactOverride" ADD CONSTRAINT "SeriesFactOverride_fact_value_check" CHECK (
  ("fact" = 'kiss' AND "value" IN ('none', 'yes', 'several')) OR
  ("fact" = 'intimacy' AND "value" IN ('none', 'implied', 'shown')) OR
  ("fact" = 'together' AND "value" IN ('yes', 'no', 'open')) OR
  ("fact" = 'ending' AND "value" IN ('happy', 'sad', 'bittersweet')) OR
  ("fact" = 'drama' AND "value" IN ('light', 'medium', 'heavy')) OR
  ("fact" = 'sidecouple' AND "value" IN ('yes', 'no')) OR
  ("fact" = 'triangle' AND "value" IN ('yes', 'no'))
);
