Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Universe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Universe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCompany" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesDubbing" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "SeriesDubbing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL,
    "basedOn" TEXT,
    "format" TEXT NOT NULL DEFAULT 'regular',
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "review" TEXT,
    "soundtrack" TEXT,
    "overallRating" INTEGER,
    "observations" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "universeId" INTEGER,
    "countryId" INTEGER,
    "productionCompanyId" INTEGER,
    "originalLanguageId" INTEGER,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT,
    "episodeCount" INTEGER,
    "year" INTEGER,
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seriesId" INTEGER NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "duration" INTEGER,
    "airDate" TIMESTAMP(3),
    "synopsis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seasonId" INTEGER NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stageName" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "imageUrl" TEXT,
    "biography" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Director" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "biography" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Director_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "flagUrl" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesActor" (
    "id" SERIAL NOT NULL,
    "character" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "seriesId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,

    CONSTRAINT "SeriesActor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonActor" (
    "id" SERIAL NOT NULL,
    "character" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "seasonId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,

    CONSTRAINT "SeasonActor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesDirector" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "directorId" INTEGER NOT NULL,

    CONSTRAINT "SeriesDirector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesTag" (
    "id" SERIAL NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "SeriesTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seriesId" INTEGER,
    "seasonId" INTEGER,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewStatus" (
    "id" SERIAL NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "watchedDate" TIMESTAMP(3),
    "currentlyWatching" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,

    CONSTRAINT "ViewStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Universe_name_key" ON "Universe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_name_key" ON "ProductionCompany"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesDubbing_seriesId_languageId_key" ON "SeriesDubbing"("seriesId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_seriesId_seasonNumber_key" ON "Season"("seriesId", "seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_name_key" ON "Actor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Director_name_key" ON "Director"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesActor_seriesId_actorId_character_key" ON "SeriesActor"("seriesId", "actorId", "character");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonActor_seasonId_actorId_character_key" ON "SeasonActor"("seasonId", "actorId", "character");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesDirector_seriesId_directorId_key" ON "SeriesDirector"("seriesId", "directorId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesTag_seriesId_tagId_key" ON "SeriesTag"("seriesId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_seriesId_seasonId_category_key" ON "Rating"("seriesId", "seasonId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_seriesId_key" ON "ViewStatus"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_seasonId_key" ON "ViewStatus"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_episodeId_key" ON "ViewStatus"("episodeId");

-- AddForeignKey
ALTER TABLE "SeriesDubbing" ADD CONSTRAINT "SeriesDubbing_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesDubbing" ADD CONSTRAINT "SeriesDubbing_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_productionCompanyId_fkey" FOREIGN KEY ("productionCompanyId") REFERENCES "ProductionCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_originalLanguageId_fkey" FOREIGN KEY ("originalLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesActor" ADD CONSTRAINT "SeriesActor_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesActor" ADD CONSTRAINT "SeriesActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonActor" ADD CONSTRAINT "SeasonActor_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonActor" ADD CONSTRAINT "SeasonActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesDirector" ADD CONSTRAINT "SeriesDirector_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesDirector" ADD CONSTRAINT "SeriesDirector_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Director"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesTag" ADD CONSTRAINT "SeriesTag_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesTag" ADD CONSTRAINT "SeriesTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewStatus" ADD CONSTRAINT "ViewStatus_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewStatus" ADD CONSTRAINT "ViewStatus_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewStatus" ADD CONSTRAINT "ViewStatus_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

