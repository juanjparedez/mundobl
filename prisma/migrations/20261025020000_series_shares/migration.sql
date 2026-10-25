-- CreateTable
CREATE TABLE "SeriesShare" (
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesShare_pkey" PRIMARY KEY ("userId","seriesId")
);

-- CreateIndex
CREATE INDEX "SeriesShare_seriesId_idx" ON "SeriesShare"("seriesId");

-- AddForeignKey
ALTER TABLE "SeriesShare" ADD CONSTRAINT "SeriesShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesShare" ADD CONSTRAINT "SeriesShare_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only; no public PostgREST policy.
ALTER TABLE "SeriesShare" ENABLE ROW LEVEL SECURITY;
