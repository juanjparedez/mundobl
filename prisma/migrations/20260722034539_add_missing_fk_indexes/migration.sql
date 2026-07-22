-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "CommentReport_userId_idx" ON "CommentReport"("userId");

-- CreateIndex
CREATE INDEX "EmbeddableContent_seriesId_idx" ON "EmbeddableContent"("seriesId");

-- CreateIndex
CREATE INDEX "EpisodeNote_episodeId_idx" ON "EpisodeNote"("episodeId");

-- CreateIndex
CREATE INDEX "FeatureRequest_userId_idx" ON "FeatureRequest"("userId");

-- CreateIndex
CREATE INDEX "FeatureRequest_assignedToId_idx" ON "FeatureRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "FeatureRequestImage_featureRequestId_idx" ON "FeatureRequestImage"("featureRequestId");

-- CreateIndex
CREATE INDEX "FeatureVote_featureRequestId_idx" ON "FeatureVote"("featureRequestId");

-- CreateIndex
CREATE INDEX "News_approvedById_idx" ON "News"("approvedById");

-- CreateIndex
CREATE INDEX "News_relatedSeriesId_idx" ON "News"("relatedSeriesId");

-- CreateIndex
CREATE INDEX "Rating_seasonId_idx" ON "Rating"("seasonId");

-- CreateIndex
CREATE INDEX "RelatedSeries_relatedSeriesId_idx" ON "RelatedSeries"("relatedSeriesId");

-- CreateIndex
CREATE INDEX "SeasonActor_actorId_idx" ON "SeasonActor"("actorId");

-- CreateIndex
CREATE INDEX "Series_universeId_idx" ON "Series"("universeId");

-- CreateIndex
CREATE INDEX "Series_countryId_idx" ON "Series"("countryId");

-- CreateIndex
CREATE INDEX "Series_productionCompanyId_idx" ON "Series"("productionCompanyId");

-- CreateIndex
CREATE INDEX "Series_originalLanguageId_idx" ON "Series"("originalLanguageId");

-- CreateIndex
CREATE INDEX "SeriesActor_actorId_idx" ON "SeriesActor"("actorId");

-- CreateIndex
CREATE INDEX "SeriesDirector_directorId_idx" ON "SeriesDirector"("directorId");

-- CreateIndex
CREATE INDEX "SeriesDubbing_languageId_idx" ON "SeriesDubbing"("languageId");

-- CreateIndex
CREATE INDEX "SeriesGenre_genreId_idx" ON "SeriesGenre"("genreId");

-- CreateIndex
CREATE INDEX "SeriesTag_tagId_idx" ON "SeriesTag"("tagId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SuggestedSite_userId_idx" ON "SuggestedSite"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_seriesId_idx" ON "UserFavorite"("seriesId");

-- CreateIndex
CREATE INDEX "UserRating_seriesId_idx" ON "UserRating"("seriesId");

-- CreateIndex
CREATE INDEX "ViewStatus_seriesId_idx" ON "ViewStatus"("seriesId");

-- CreateIndex
CREATE INDEX "ViewStatus_seasonId_idx" ON "ViewStatus"("seasonId");

-- CreateIndex
CREATE INDEX "ViewStatus_episodeId_idx" ON "ViewStatus"("episodeId");

-- CreateIndex
CREATE INDEX "WatchLink_seriesId_idx" ON "WatchLink"("seriesId");
