-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "contentRating" TEXT NOT NULL DEFAULT 'UNREVIEWED',
ADD COLUMN     "contentRatingSource" TEXT,
ADD COLUMN     "contentReviewedAt" TIMESTAMP(3),
ADD COLUMN     "contentReviewedBy" TEXT,
ADD COLUMN     "contentWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PilotClickDaily" (
    "day" DATE NOT NULL,
    "placement" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PilotClickDaily_pkey" PRIMARY KEY ("day","placement")
);

-- Server-only aggregates; no public PostgREST policy.
ALTER TABLE "PilotClickDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PilotClickDaily" ADD CONSTRAINT "PilotClickDaily_placement_check" CHECK ("placement" IN ('series', 'platforms'));
ALTER TABLE "PilotClickDaily" ADD CONSTRAINT "PilotClickDaily_clicks_check" CHECK ("clicks" >= 0);
ALTER TABLE "Series" ADD CONSTRAINT "Series_contentRating_check" CHECK ("contentRating" IN ('UNREVIEWED', 'GENERAL', 'ADULT18'));
ALTER TABLE "Series" ADD CONSTRAINT "Series_contentWarnings_check" CHECK ("contentWarnings" <@ ARRAY['SEX', 'NUDITY', 'VIOLENCE', 'ABUSE', 'SELF_HARM']::TEXT[]);
