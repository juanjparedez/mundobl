-- CreateEnum
CREATE TYPE "TrackingEventKind" AS ENUM ('RECORDED', 'STATUS_CHANGED', 'DATE_CHANGED', 'SNAPSHOT');

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "TrackingEventKind" NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "previousStatus" "WatchStatus",
    "watchedDate" TIMESTAMP(3),
    "previousWatchedDate" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("userId","id")
);

-- CreateIndex
CREATE INDEX "TrackingEvent_userId_recordedAt_id_idx" ON "TrackingEvent"("userId", "recordedAt", "id");

-- CreateIndex
CREATE INDEX "TrackingEvent_seriesId_idx" ON "TrackingEvent"("seriesId");

-- CreateIndex
CREATE INDEX "TrackingEvent_seasonId_idx" ON "TrackingEvent"("seasonId");

-- CreateIndex
CREATE INDEX "TrackingEvent_episodeId_idx" ON "TrackingEvent"("episodeId");

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackingEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_one_target"
    CHECK (num_nonnulls("seriesId", "seasonId", "episodeId") = 1);

-- The old state is a snapshot, not evidence of when a tracking action happened.
-- Preserve unknown watch dates and label these records distinctly in the UI.
INSERT INTO "TrackingEvent" (
    "id", "userId", "kind", "status", "watchedDate", "seriesId", "seasonId", "episodeId"
)
SELECT gen_random_uuid()::text, "userId", 'SNAPSHOT', "status", "watchedDate",
    "seriesId", "seasonId", "episodeId"
FROM "ViewStatus"
WHERE "userId" IS NOT NULL AND "status" <> 'SIN_VER'
    AND num_nonnulls("seriesId", "seasonId", "episodeId") = 1;

-- Capture changes transactionally from every writer (single mark, batch, import,
-- manual state, date correction). Repeated identical commands add no event.
CREATE FUNCTION public.capture_tracking_event() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    event_kind public."TrackingEventKind";
    prior_status public."WatchStatus";
    prior_date timestamp(3);
BEGIN
    IF current_setting('mundobl.restoring_tracking_history', true) = 'on'
        OR NEW."userId" IS NULL
        OR num_nonnulls(NEW."seriesId", NEW."seasonId", NEW."episodeId") <> 1 THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        IF NEW."status" = 'SIN_VER' AND NEW."watchedDate" IS NULL THEN RETURN NEW; END IF;
        event_kind := 'RECORDED';
    ELSIF ROW(OLD."userId", OLD."seriesId", OLD."seasonId", OLD."episodeId")
        IS DISTINCT FROM ROW(NEW."userId", NEW."seriesId", NEW."seasonId", NEW."episodeId") THEN
        event_kind := 'RECORDED';
    ELSE
        IF ROW(OLD."status", OLD."watchedDate") IS NOT DISTINCT FROM ROW(NEW."status", NEW."watchedDate") THEN
            RETURN NEW;
        END IF;
        prior_status := OLD."status";
        prior_date := OLD."watchedDate";
        event_kind := CASE WHEN OLD."status" IS DISTINCT FROM NEW."status"
            THEN 'STATUS_CHANGED'::public."TrackingEventKind"
            ELSE 'DATE_CHANGED'::public."TrackingEventKind" END;
    END IF;
    INSERT INTO public."TrackingEvent" (
        "id", "userId", "kind", "status", "previousStatus", "watchedDate", "previousWatchedDate",
        "recordedAt", "seriesId", "seasonId", "episodeId"
    ) VALUES (
        gen_random_uuid()::text, NEW."userId", event_kind, NEW."status", prior_status,
        NEW."watchedDate", prior_date, clock_timestamp(), NEW."seriesId", NEW."seasonId", NEW."episodeId"
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER "ViewStatus_tracking_history"
AFTER INSERT OR UPDATE ON "ViewStatus"
FOR EACH ROW EXECUTE FUNCTION public.capture_tracking_event();
