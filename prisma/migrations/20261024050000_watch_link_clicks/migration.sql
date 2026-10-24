-- CreateTable
CREATE TABLE "WatchLinkClickDaily" (
    "day" DATE NOT NULL,
    "watchLinkId" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WatchLinkClickDaily_pkey" PRIMARY KEY ("day","watchLinkId","surface")
);

-- CreateIndex
CREATE INDEX "WatchLinkClickDaily_watchLinkId_idx" ON "WatchLinkClickDaily"("watchLinkId");

-- AddForeignKey
ALTER TABLE "WatchLinkClickDaily" ADD CONSTRAINT "WatchLinkClickDaily_watchLinkId_fkey" FOREIGN KEY ("watchLinkId") REFERENCES "WatchLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only aggregates; no public PostgREST policy.
ALTER TABLE "WatchLinkClickDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchLinkClickDaily" ADD CONSTRAINT "WatchLinkClickDaily_surface_check" CHECK ("surface" IN ('series', 'info', 'watching'));
ALTER TABLE "WatchLinkClickDaily" ADD CONSTRAINT "WatchLinkClickDaily_clicks_check" CHECK ("clicks" >= 0);
