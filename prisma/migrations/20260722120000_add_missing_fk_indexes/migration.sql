-- Add covering indexes on every foreign-key column that lacked one.
-- Supabase Performance Advisor ("unindexed_foreign_keys") flags exactly
-- estas columnas: Postgres NO crea indices automaticos sobre las FK, y un
-- indice compuesto (@@unique/@@index) solo cubre la FK si la columna es la
-- PRIMERA de la lista. Sin indice, cada DELETE/UPDATE del padre y cada JOIN
-- por la FK hace seq scan del hijo.
--
-- Locking: CREATE INDEX toma un SHARE lock (bloquea writes, no reads) por
-- fila. Las tablas de este proyecto son chicas, asi que el lock es de ms.
-- No se usa CONCURRENTLY porque Prisma corre la migracion en una transaccion
-- (y el prod se sincroniza con `prisma db push`, que tampoco lo soporta).

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SeriesDubbing_languageId_idx" ON "SeriesDubbing"("languageId");

-- CreateIndex
CREATE INDEX "Series_universeId_idx" ON "Series"("universeId");

-- CreateIndex
CREATE INDEX "Series_countryId_idx" ON "Series"("countryId");

-- CreateIndex
CREATE INDEX "Series_productionCompanyId_idx" ON "Series"("productionCompanyId");

-- CreateIndex
CREATE INDEX "Series_originalLanguageId_idx" ON "Series"("originalLanguageId");

-- CreateIndex
CREATE INDEX "EpisodeNote_episodeId_idx" ON "EpisodeNote"("episodeId");

-- CreateIndex
CREATE INDEX "SeriesGenre_genreId_idx" ON "SeriesGenre"("genreId");

-- CreateIndex
CREATE INDEX "SeriesActor_actorId_idx" ON "SeriesActor"("actorId");

-- CreateIndex
CREATE INDEX "SeasonActor_actorId_idx" ON "SeasonActor"("actorId");

-- CreateIndex
CREATE INDEX "SeriesDirector_directorId_idx" ON "SeriesDirector"("directorId");

-- CreateIndex
CREATE INDEX "SeriesTag_tagId_idx" ON "SeriesTag"("tagId");

-- CreateIndex
CREATE INDEX "RelatedSeries_relatedSeriesId_idx" ON "RelatedSeries"("relatedSeriesId");

-- CreateIndex
CREATE INDEX "Rating_seasonId_idx" ON "Rating"("seasonId");

-- CreateIndex
CREATE INDEX "UserRating_seriesId_idx" ON "UserRating"("seriesId");

-- CreateIndex
CREATE INDEX "CommentReport_userId_idx" ON "CommentReport"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_seriesId_idx" ON "UserFavorite"("seriesId");

-- CreateIndex
CREATE INDEX "ViewStatus_seriesId_idx" ON "ViewStatus"("seriesId");

-- CreateIndex
CREATE INDEX "ViewStatus_seasonId_idx" ON "ViewStatus"("seasonId");

-- CreateIndex
CREATE INDEX "ViewStatus_episodeId_idx" ON "ViewStatus"("episodeId");

-- CreateIndex
CREATE INDEX "FeatureRequest_userId_idx" ON "FeatureRequest"("userId");

-- CreateIndex
CREATE INDEX "FeatureRequest_assignedToId_idx" ON "FeatureRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "FeatureRequestImage_featureRequestId_idx" ON "FeatureRequestImage"("featureRequestId");

-- CreateIndex
CREATE INDEX "FeatureVote_featureRequestId_idx" ON "FeatureVote"("featureRequestId");

-- CreateIndex
CREATE INDEX "SuggestedSite_userId_idx" ON "SuggestedSite"("userId");

-- CreateIndex
CREATE INDEX "WatchLink_seriesId_idx" ON "WatchLink"("seriesId");

-- CreateIndex
CREATE INDEX "EmbeddableContent_seriesId_idx" ON "EmbeddableContent"("seriesId");

-- CreateIndex
CREATE INDEX "News_approvedById_idx" ON "News"("approvedById");

-- CreateIndex
CREATE INDEX "News_relatedSeriesId_idx" ON "News"("relatedSeriesId");

