-- CreateTable
CREATE TABLE "Writer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nationality" TEXT,
    "biography" TEXT,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "imageAttribution" TEXT,
    "imageLicense" TEXT,
    "bioSourceUrl" TEXT,
    "imdbUrl" TEXT,
    "mdlUrl" TEXT,
    "wikiUrl" TEXT,
    "wikidataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Writer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesWriter" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "writerId" INTEGER NOT NULL,
    "sourceUrl" TEXT,

    CONSTRAINT "SeriesWriter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Writer_name_key" ON "Writer"("name");

-- CreateIndex
CREATE INDEX "Writer_wikidataId_idx" ON "Writer"("wikidataId");

-- CreateIndex
CREATE INDEX "SeriesWriter_writerId_idx" ON "SeriesWriter"("writerId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesWriter_seriesId_writerId_key" ON "SeriesWriter"("seriesId", "writerId");

-- AddForeignKey
ALTER TABLE "SeriesWriter" ADD CONSTRAINT "SeriesWriter_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesWriter" ADD CONSTRAINT "SeriesWriter_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "Writer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Same server-only database access policy as other editorial entities.
-- RLS is enabled after table creation below.

ALTER TABLE "Writer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesWriter" ENABLE ROW LEVEL SECURITY;
