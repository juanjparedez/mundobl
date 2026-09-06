-- AlterTable
ALTER TABLE "Actor" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "awards" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bioSource" TEXT,
ADD COLUMN     "bioSourceUrl" TEXT,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageLicense" TEXT,
ADD COLUMN     "imageSource" TEXT,
ADD COLUMN     "imdbUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mdlUrl" TEXT,
ADD COLUMN     "tmdbPersonId" INTEGER,
ADD COLUMN     "wikiUrl" TEXT,
ADD COLUMN     "wikidataId" TEXT,
ADD COLUMN     "xUrl" TEXT;

-- AlterTable
ALTER TABLE "Director" ADD COLUMN     "bioSource" TEXT,
ADD COLUMN     "bioSourceUrl" TEXT,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageLicense" TEXT,
ADD COLUMN     "imageSource" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "tmdbPersonId" INTEGER,
ADD COLUMN     "wikidataId" TEXT,
ADD COLUMN     "xUrl" TEXT;

-- AlterTable
ALTER TABLE "ProductionCompany" ADD COLUMN     "bioSource" TEXT,
ADD COLUMN     "bioSourceUrl" TEXT,
ADD COLUMN     "countryId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageLicense" TEXT,
ADD COLUMN     "imageSource" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tmdbCompanyId" INTEGER,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "wikidataId" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "SeriesProductionCompany" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "productionCompanyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeriesProductionCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonEnrichment" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "sourceUrl" TEXT,
    "payload" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeriesProductionCompany_productionCompanyId_idx" ON "SeriesProductionCompany"("productionCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesProductionCompany_seriesId_productionCompanyId_key" ON "SeriesProductionCompany"("seriesId", "productionCompanyId");

-- CreateIndex
CREATE INDEX "PersonEnrichment_status_confidence_idx" ON "PersonEnrichment"("status", "confidence");

-- CreateIndex
CREATE INDEX "PersonEnrichment_entityType_entityId_idx" ON "PersonEnrichment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEnrichment_entityType_entityId_source_key" ON "PersonEnrichment"("entityType", "entityId", "source");

-- CreateIndex
CREATE INDEX "Actor_isPlaceholder_idx" ON "Actor"("isPlaceholder");

-- CreateIndex
CREATE INDEX "Actor_wikidataId_idx" ON "Actor"("wikidataId");

-- CreateIndex
CREATE INDEX "Director_wikidataId_idx" ON "Director"("wikidataId");

-- CreateIndex
CREATE INDEX "Episode_embedUrl_idx" ON "Episode"("embedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_slug_key" ON "ProductionCompany"("slug");

-- CreateIndex
CREATE INDEX "ProductionCompany_countryId_idx" ON "ProductionCompany"("countryId");

-- CreateIndex
CREATE INDEX "ProductionCompany_wikidataId_idx" ON "ProductionCompany"("wikidataId");

-- CreateIndex
CREATE INDEX "Series_catalogScope_origin_idx" ON "Series"("catalogScope", "origin");

-- CreateIndex
CREATE INDEX "Series_createdAt_idx" ON "Series"("createdAt");

-- CreateIndex
CREATE INDEX "Series_title_idx" ON "Series"("title");

-- CreateIndex
CREATE INDEX "ViewStatus_status_idx" ON "ViewStatus"("status");

-- AddForeignKey
ALTER TABLE "ProductionCompany" ADD CONSTRAINT "ProductionCompany_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesProductionCompany" ADD CONSTRAINT "SeriesProductionCompany_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesProductionCompany" ADD CONSTRAINT "SeriesProductionCompany_productionCompanyId_fkey" FOREIGN KEY ("productionCompanyId") REFERENCES "ProductionCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

