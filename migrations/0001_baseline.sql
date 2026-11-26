-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "nickname" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VISITOR',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "socials" JSONB,
    "watchingPreferences" JSONB,
    "glossaryQuizBestScore" INTEGER,
    "onboardingCompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserActiveDay" (
    "userId" TEXT NOT NULL,
    "day" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "day"),
    CONSTRAINT "UserActiveDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesShare" (
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "seriesId"),
    CONSTRAINT "SeriesShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesShare_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "key"),
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDashboardLayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dashboardKey" TEXT NOT NULL,
    "layouts" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDashboardLayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Universe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionCompany" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "countryId" INTEGER,
    "slug" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "youtubeUrl" TEXT,
    "foundedYear" INTEGER,
    "imageUrl" TEXT,
    "wikidataId" TEXT,
    "tmdbCompanyId" INTEGER,
    "imageSource" TEXT,
    "imageAttribution" TEXT,
    "imageLicense" TEXT,
    "bioSource" TEXT,
    "bioSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionCompany_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesProductionCompany" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "productionCompanyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeriesProductionCompany_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesProductionCompany_productionCompanyId_fkey" FOREIGN KEY ("productionCompanyId") REFERENCES "ProductionCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Language" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT
);

-- CreateTable
CREATE TABLE "SeriesDubbing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    CONSTRAINT "SeriesDubbing_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesDubbing_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Series" (
    "contentRating" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "contentWarnings" JSONB NOT NULL DEFAULT '[]',
    "contentRatingSource" TEXT,
    "contentReviewedAt" DATETIME,
    "contentReviewedBy" TEXT,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL,
    "basedOn" TEXT,
    "format" TEXT NOT NULL DEFAULT 'regular',
    "imageUrl" TEXT,
    "imageThumbUrl" TEXT,
    "imagePosition" TEXT NOT NULL DEFAULT 'center',
    "synopsis" TEXT,
    "review" TEXT,
    "soundtrack" TEXT,
    "overallRating" INTEGER,
    "observations" TEXT,
    "notesPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "geoRestrictedCore" BOOLEAN NOT NULL DEFAULT false,
    "catalogScope" TEXT NOT NULL DEFAULT 'PERSONAL',
    "origin" TEXT NOT NULL DEFAULT 'CURATED',
    "durationMinutes" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'VISIBLE',
    "submittedById" TEXT,
    "linkedSeriesId" INTEGER,
    "airDays" TEXT,
    "editVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "universeId" INTEGER,
    "isUniverseMain" BOOLEAN NOT NULL DEFAULT false,
    "countryId" INTEGER,
    "productionCompanyId" INTEGER,
    "originalLanguageId" INTEGER,
    CONSTRAINT "Series_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_productionCompanyId_fkey" FOREIGN KEY ("productionCompanyId") REFERENCES "ProductionCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_originalLanguageId_fkey" FOREIGN KEY ("originalLanguageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_linkedSeriesId_fkey" FOREIGN KEY ("linkedSeriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesRevision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "editVersion" INTEGER NOT NULL,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SeriesInfoBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "SeriesInfoBlock_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT,
    "episodeCount" INTEGER,
    "year" INTEGER,
    "imageUrl" TEXT,
    "imageThumbUrl" TEXT,
    "synopsis" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "Season_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "duration" INTEGER,
    "durationSeconds" INTEGER,
    "airDate" DATETIME,
    "synopsis" TEXT,
    "embedUrl" TEXT,
    "embedPlatform" TEXT,
    "embedVideoId" TEXT,
    "embedChannelName" TEXT,
    "embedChannelUrl" TEXT,
    "playback" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "playbackCheckedAt" DATETIME,
    "youtubeViewCount" INTEGER,
    "youtubeLikeCount" INTEGER,
    "playbackBlockedMarkets" JSONB NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seasonId" INTEGER NOT NULL,
    CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EpisodeNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,
    CONSTRAINT "EpisodeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EpisodeNote_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "SeriesNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesNote_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Actor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "stageName" TEXT,
    "birthDate" DATETIME,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "biography" TEXT,
    "funFacts" JSONB NOT NULL DEFAULT '[]',
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "awards" JSONB NOT NULL DEFAULT '[]',
    "imdbUrl" TEXT,
    "mdlUrl" TEXT,
    "wikiUrl" TEXT,
    "wikidataId" TEXT,
    "tmdbPersonId" INTEGER,
    "imageSource" TEXT,
    "imageAttribution" TEXT,
    "imageLicense" TEXT,
    "bioSource" TEXT,
    "bioSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmbedPreviewCache" (
    "videoId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("videoId", "platform")
);

-- CreateTable
CREATE TABLE "Director" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "biography" TEXT,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "imdbUrl" TEXT,
    "mdlUrl" TEXT,
    "wikiUrl" TEXT,
    "birthYear" INTEGER,
    "awards" JSONB NOT NULL DEFAULT '[]',
    "wikidataId" TEXT,
    "tmdbPersonId" INTEGER,
    "imageSource" TEXT,
    "imageAttribution" TEXT,
    "imageLicense" TEXT,
    "bioSource" TEXT,
    "bioSourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Writer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "aliases" JSONB NOT NULL DEFAULT '[]',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "flagUrl" TEXT
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesGenre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "SeriesGenre_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesActor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "character" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "pairingGroup" INTEGER,
    "seriesId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    CONSTRAINT "SeriesActor_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeasonActor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "character" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "seasonId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    CONSTRAINT "SeasonActor_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeasonActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesDirector" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "directorId" INTEGER NOT NULL,
    CONSTRAINT "SeriesDirector_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesDirector_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Director" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesWriter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "writerId" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    CONSTRAINT "SeriesWriter_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesWriter_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "Writer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "SeriesTag_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "transliteration" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "commonMistake" TEXT,
    "examples" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlossaryTermTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "glossaryTermId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "GlossaryTermTag_glossaryTermId_fkey" FOREIGN KEY ("glossaryTermId") REFERENCES "GlossaryTerm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GlossaryTermTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlossarySuggestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "term" TEXT NOT NULL,
    "transliteration" TEXT,
    "country" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT NOT NULL DEFAULT 'fandom',
    "meaning" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "commonMistake" TEXT,
    "examples" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlossarySuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelatedSeries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mainSeriesId" INTEGER NOT NULL,
    "relatedSeriesId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RelatedSeries_mainSeriesId_fkey" FOREIGN KEY ("mainSeriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RelatedSeries_relatedSeriesId_fkey" FOREIGN KEY ("relatedSeriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    CONSTRAINT "Rating_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "UserRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRating_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "reportedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,
    "parentId" INTEGER,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesSuggestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeriesSuggestion_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserFavorite_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "SeriesSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesSubscription_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "authKey" TEXT NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPrefs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestSentAt" DATETIME,
    "notifySeasonAdded" BOOLEAN NOT NULL DEFAULT true,
    "notifyContentAdded" BOOLEAN NOT NULL DEFAULT true,
    "notifyReviewPublished" BOOLEAN NOT NULL DEFAULT true,
    "notifyCommentReply" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdminComments" BOOLEAN NOT NULL DEFAULT true,
    "quietStart" TEXT,
    "quietEnd" TEXT,
    CONSTRAINT "NotificationPrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "previousStatus" TEXT,
    "watchedDate" DATETIME,
    "previousWatchedDate" DATETIME,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,

    PRIMARY KEY ("userId", "id"),
    CONSTRAINT "TrackingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackingEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackingEvent_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackingEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lease" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ViewStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'SIN_VER',
    "watchedDate" DATETIME,
    "lastWatchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "seriesId" INTEGER,
    "seasonId" INTEGER,
    "episodeId" INTEGER,
    CONSTRAINT "ViewStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewStatus_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewStatus_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewStatus_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "official" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "assignedToId" TEXT,
    CONSTRAINT "FeatureRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeatureRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureRequestImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "featureRequestId" INTEGER NOT NULL,
    CONSTRAINT "FeatureRequestImage_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "featureRequestId" INTEGER NOT NULL,
    CONSTRAINT "FeatureVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeatureVote_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureRequestComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "featureRequestId" INTEGER NOT NULL,
    CONSTRAINT "FeatureRequestComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeatureRequestComment_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BannedIp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecommendedSite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "language" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SuggestedSite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "language" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "adminNote" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SuggestedSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "WatchLink_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchLinkClickDaily" (
    "day" DATETIME NOT NULL,
    "watchLinkId" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("day", "watchLinkId", "surface"),
    CONSTRAINT "WatchLinkClickDaily_watchLinkId_fkey" FOREIGN KEY ("watchLinkId") REFERENCES "WatchLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmbeddableContent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "videoId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "language" TEXT,
    "thumbnailUrl" TEXT,
    "channelName" TEXT,
    "channelUrl" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seriesId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmbeddableContent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkPath" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "verdict" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "plotRating" INTEGER,
    "chemistryRating" INTEGER,
    "ostRating" INTEGER,
    "castingRating" INTEGER,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "unhelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helpful" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangelogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" TEXT NOT NULL,
    "versionLabel" TEXT,
    "category" TEXT,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'INFO',
    "audience" TEXT NOT NULL DEFAULT 'EVERYONE',
    "surface" TEXT NOT NULL DEFAULT 'BANNER',
    "template" TEXT NOT NULL DEFAULT 'SIMPLE',
    "pages" JSONB NOT NULL DEFAULT '[]',
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emailSentAt" DATETIME,
    "emailSentCount" INTEGER,
    "createdById" TEXT,
    CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnouncementRecipient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announcementId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AnnouncementRecipient_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "News" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceLogo" TEXT,
    "imageUrl" TEXT,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "florNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "relatedSeriesId" INTEGER,
    CONSTRAINT "News_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "News_relatedSeriesId_fkey" FOREIGN KEY ("relatedSeriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "newsId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "NewsTag_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NewsTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonEnrichment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "sourceUrl" TEXT,
    "payload" JSONB NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportThread" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SupportThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" INTEGER NOT NULL,
    "userId" TEXT,
    "fromStaff" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SupportMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "SupportThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityTopic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    "seriesId" INTEGER,
    "episodeId" INTEGER,
    CONSTRAINT "CommunityTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommunityTopic_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityTopic_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityReply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "recommendedSeriesId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "topicId" INTEGER NOT NULL,
    CONSTRAINT "CommunityReply_recommendedSeriesId_fkey" FOREIGN KEY ("recommendedSeriesId") REFERENCES "Series" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommunityReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommunityReply_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "showAvatar" BOOLEAN NOT NULL DEFAULT false,
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "promptChoice" TEXT NOT NULL DEFAULT 'NEW',
    "promptAfter" DATETIME,
    "aliasSeed" INTEGER,
    "aliasUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'STANDARD',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "moderationHidden" BOOLEAN NOT NULL DEFAULT false,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "RecommendationList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RecommendationListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "RecommendationList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecommendationListItem_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityFollow" (
    "userId" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "topicId"),
    CONSTRAINT "CommunityFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityFollow_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityBlock" (
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "targetId"),
    CONSTRAINT "CommunityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityBlock_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityModerationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "moderatorId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CommunityReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommunityModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunitySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "conversationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "listsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "profilesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "promptEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "draft" JSONB NOT NULL,
    "published" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeriesActivityDaily" (
    "day" DATETIME NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("day", "seriesId", "kind", "source", "country"),
    CONSTRAINT "SeriesActivityDaily_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesReactionCount" (
    "seriesId" INTEGER NOT NULL,
    "reaction" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("seriesId", "reaction"),
    CONSTRAINT "SeriesReactionCount_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesFactVote" (
    "seriesId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("seriesId", "userId", "fact"),
    CONSTRAINT "SeriesFactVote_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeriesFactVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeriesFactOverride" (
    "seriesId" INTEGER NOT NULL,
    "fact" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "setById" TEXT,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("seriesId", "fact"),
    CONSTRAINT "SeriesFactOverride_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteTrafficDaily" (
    "day" DATETIME NOT NULL,
    "section" TEXT NOT NULL,
    "flow" TEXT NOT NULL DEFAULT 'direct',
    "source" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("day", "section", "flow", "source", "country")
);

-- CreateTable
CREATE TABLE "PilotClickDaily" (
    "day" DATETIME NOT NULL,
    "placement" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("day", "placement")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserActiveDay_day_idx" ON "UserActiveDay"("day");

-- CreateIndex
CREATE INDEX "SeriesShare_seriesId_idx" ON "SeriesShare"("seriesId");

-- CreateIndex
CREATE INDEX "UserAchievement_key_idx" ON "UserAchievement"("key");

-- CreateIndex
CREATE INDEX "UserDashboardLayout_userId_idx" ON "UserDashboardLayout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDashboardLayout_userId_dashboardKey_key" ON "UserDashboardLayout"("userId", "dashboardKey");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Universe_name_key" ON "Universe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_name_key" ON "ProductionCompany"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionCompany_slug_key" ON "ProductionCompany"("slug");

-- CreateIndex
CREATE INDEX "ProductionCompany_countryId_idx" ON "ProductionCompany"("countryId");

-- CreateIndex
CREATE INDEX "ProductionCompany_wikidataId_idx" ON "ProductionCompany"("wikidataId");

-- CreateIndex
CREATE INDEX "SeriesProductionCompany_productionCompanyId_idx" ON "SeriesProductionCompany"("productionCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesProductionCompany_seriesId_productionCompanyId_key" ON "SeriesProductionCompany"("seriesId", "productionCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE INDEX "SeriesDubbing_languageId_idx" ON "SeriesDubbing"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesDubbing_seriesId_languageId_key" ON "SeriesDubbing"("seriesId", "languageId");

-- CreateIndex
CREATE INDEX "Series_origin_visibility_idx" ON "Series"("origin", "visibility");

-- CreateIndex
CREATE INDEX "Series_submittedById_createdAt_idx" ON "Series"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "Series_linkedSeriesId_idx" ON "Series"("linkedSeriesId");

-- CreateIndex
CREATE INDEX "Series_universeId_idx" ON "Series"("universeId");

-- CreateIndex
CREATE INDEX "Series_countryId_idx" ON "Series"("countryId");

-- CreateIndex
CREATE INDEX "Series_productionCompanyId_idx" ON "Series"("productionCompanyId");

-- CreateIndex
CREATE INDEX "Series_originalLanguageId_idx" ON "Series"("originalLanguageId");

-- CreateIndex
CREATE INDEX "Series_featured_featuredOrder_idx" ON "Series"("featured", "featuredOrder");

-- CreateIndex
CREATE INDEX "Series_catalogScope_origin_idx" ON "Series"("catalogScope", "origin");

-- CreateIndex
CREATE INDEX "Series_createdAt_idx" ON "Series"("createdAt");

-- CreateIndex
CREATE INDEX "Series_title_idx" ON "Series"("title");

-- CreateIndex
CREATE INDEX "SeriesRevision_seriesId_createdAt_idx" ON "SeriesRevision"("seriesId", "createdAt");

-- CreateIndex
CREATE INDEX "SeriesInfoBlock_seriesId_sortOrder_idx" ON "SeriesInfoBlock"("seriesId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Season_seriesId_seasonNumber_key" ON "Season"("seriesId", "seasonNumber");

-- CreateIndex
CREATE INDEX "Episode_embedUrl_idx" ON "Episode"("embedUrl");

-- CreateIndex
CREATE INDEX "Episode_playback_playbackCheckedAt_idx" ON "Episode"("playback", "playbackCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_episodeNumber_key" ON "Episode"("seasonId", "episodeNumber");

-- CreateIndex
CREATE INDEX "EpisodeNote_userId_updatedAt_idx" ON "EpisodeNote"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "EpisodeNote_episodeId_idx" ON "EpisodeNote"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeNote_userId_episodeId_key" ON "EpisodeNote"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "SeriesNote_userId_updatedAt_idx" ON "SeriesNote"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SeriesNote_seriesId_idx" ON "SeriesNote"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesNote_userId_seriesId_key" ON "SeriesNote"("userId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "Actor_name_key" ON "Actor"("name");

-- CreateIndex
CREATE INDEX "Actor_isPlaceholder_idx" ON "Actor"("isPlaceholder");

-- CreateIndex
CREATE INDEX "Actor_wikidataId_idx" ON "Actor"("wikidataId");

-- CreateIndex
CREATE INDEX "EmbedPreviewCache_createdAt_idx" ON "EmbedPreviewCache"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Director_name_key" ON "Director"("name");

-- CreateIndex
CREATE INDEX "Director_wikidataId_idx" ON "Director"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "Writer_name_key" ON "Writer"("name");

-- CreateIndex
CREATE INDEX "Writer_wikidataId_idx" ON "Writer"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "SeriesGenre_genreId_idx" ON "SeriesGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesGenre_seriesId_genreId_key" ON "SeriesGenre"("seriesId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "SeriesActor_actorId_idx" ON "SeriesActor"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesActor_seriesId_actorId_character_key" ON "SeriesActor"("seriesId", "actorId", "character");

-- CreateIndex
CREATE INDEX "SeasonActor_actorId_idx" ON "SeasonActor"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonActor_seasonId_actorId_character_key" ON "SeasonActor"("seasonId", "actorId", "character");

-- CreateIndex
CREATE INDEX "SeriesDirector_directorId_idx" ON "SeriesDirector"("directorId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesDirector_seriesId_directorId_key" ON "SeriesDirector"("seriesId", "directorId");

-- CreateIndex
CREATE INDEX "SeriesWriter_writerId_idx" ON "SeriesWriter"("writerId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesWriter_seriesId_writerId_key" ON "SeriesWriter"("seriesId", "writerId");

-- CreateIndex
CREATE INDEX "SeriesTag_tagId_idx" ON "SeriesTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesTag_seriesId_tagId_key" ON "SeriesTag"("seriesId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_slug_key" ON "GlossaryTerm"("slug");

-- CreateIndex
CREATE INDEX "GlossaryTerm_status_country_category_idx" ON "GlossaryTerm"("status", "country", "category");

-- CreateIndex
CREATE INDEX "GlossaryTerm_status_publishedAt_idx" ON "GlossaryTerm"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "GlossaryTermTag_tagId_idx" ON "GlossaryTermTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTermTag_glossaryTermId_tagId_key" ON "GlossaryTermTag"("glossaryTermId", "tagId");

-- CreateIndex
CREATE INDEX "GlossarySuggestion_status_userId_idx" ON "GlossarySuggestion"("status", "userId");

-- CreateIndex
CREATE INDEX "GlossarySuggestion_createdAt_idx" ON "GlossarySuggestion"("createdAt");

-- CreateIndex
CREATE INDEX "RelatedSeries_relatedSeriesId_idx" ON "RelatedSeries"("relatedSeriesId");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedSeries_mainSeriesId_relatedSeriesId_key" ON "RelatedSeries"("mainSeriesId", "relatedSeriesId");

-- CreateIndex
CREATE INDEX "Rating_seasonId_idx" ON "Rating"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_seriesId_seasonId_category_key" ON "Rating"("seriesId", "seasonId", "category");

-- CreateIndex
CREATE INDEX "UserRating_seriesId_idx" ON "UserRating"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRating_userId_seriesId_category_key" ON "UserRating"("userId", "seriesId", "category");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_seriesId_idx" ON "Comment"("seriesId");

-- CreateIndex
CREATE INDEX "Comment_seasonId_idx" ON "Comment"("seasonId");

-- CreateIndex
CREATE INDEX "Comment_episodeId_idx" ON "Comment"("episodeId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_reportCount_idx" ON "Comment"("reportCount");

-- CreateIndex
CREATE INDEX "CommentReport_commentId_idx" ON "CommentReport"("commentId");

-- CreateIndex
CREATE INDEX "CommentReport_userId_idx" ON "CommentReport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReport_commentId_userId_key" ON "CommentReport"("commentId", "userId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_seriesId_idx" ON "SeriesSuggestion"("seriesId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_userId_idx" ON "SeriesSuggestion"("userId");

-- CreateIndex
CREATE INDEX "SeriesSuggestion_status_idx" ON "SeriesSuggestion"("status");

-- CreateIndex
CREATE INDEX "UserFavorite_seriesId_idx" ON "UserFavorite"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_seriesId_key" ON "UserFavorite"("userId", "seriesId");

-- CreateIndex
CREATE INDEX "SeriesSubscription_seriesId_idx" ON "SeriesSubscription"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesSubscription_userId_seriesId_key" ON "SeriesSubscription"("userId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPrefs_userId_key" ON "NotificationPrefs"("userId");

-- CreateIndex
CREATE INDEX "TrackingEvent_userId_recordedAt_id_idx" ON "TrackingEvent"("userId", "recordedAt", "id");

-- CreateIndex
CREATE INDEX "TrackingEvent_seriesId_idx" ON "TrackingEvent"("seriesId");

-- CreateIndex
CREATE INDEX "TrackingEvent_seasonId_idx" ON "TrackingEvent"("seasonId");

-- CreateIndex
CREATE INDEX "TrackingEvent_episodeId_idx" ON "TrackingEvent"("episodeId");

-- CreateIndex
CREATE INDEX "ViewStatus_status_idx" ON "ViewStatus"("status");

-- CreateIndex
CREATE INDEX "ViewStatus_seriesId_idx" ON "ViewStatus"("seriesId");

-- CreateIndex
CREATE INDEX "ViewStatus_seasonId_idx" ON "ViewStatus"("seasonId");

-- CreateIndex
CREATE INDEX "ViewStatus_episodeId_idx" ON "ViewStatus"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_userId_seriesId_key" ON "ViewStatus"("userId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_userId_seasonId_key" ON "ViewStatus"("userId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewStatus_userId_episodeId_key" ON "ViewStatus"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "FeatureRequest_userId_idx" ON "FeatureRequest"("userId");

-- CreateIndex
CREATE INDEX "FeatureRequest_assignedToId_idx" ON "FeatureRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "FeatureRequestImage_featureRequestId_idx" ON "FeatureRequestImage"("featureRequestId");

-- CreateIndex
CREATE INDEX "FeatureVote_featureRequestId_idx" ON "FeatureVote"("featureRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureVote_userId_featureRequestId_key" ON "FeatureVote"("userId", "featureRequestId");

-- CreateIndex
CREATE INDEX "FeatureRequestComment_featureRequestId_createdAt_idx" ON "FeatureRequestComment"("featureRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureRequestComment_userId_createdAt_idx" ON "FeatureRequestComment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_userId_idx" ON "AccessLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BannedIp_ip_key" ON "BannedIp"("ip");

-- CreateIndex
CREATE INDEX "SuggestedSite_userId_idx" ON "SuggestedSite"("userId");

-- CreateIndex
CREATE INDEX "WatchLink_seriesId_idx" ON "WatchLink"("seriesId");

-- CreateIndex
CREATE INDEX "WatchLinkClickDaily_watchLinkId_idx" ON "WatchLinkClickDaily"("watchLinkId");

-- CreateIndex
CREATE INDEX "EmbeddableContent_seriesId_idx" ON "EmbeddableContent"("seriesId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Review_seriesId_status_publishedAt_idx" ON "Review"("seriesId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Review_seriesId_isFeatured_idx" ON "Review"("seriesId", "isFeatured");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_seriesId_language_key" ON "Review"("userId", "seriesId", "language");

-- CreateIndex
CREATE INDEX "ReviewVote_userId_createdAt_idx" ON "ReviewVote"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_userId_key" ON "ReviewVote"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "ChangelogItem_version_sortOrder_idx" ON "ChangelogItem"("version", "sortOrder");

-- CreateIndex
CREATE INDEX "Announcement_isActive_startsAt_endsAt_idx" ON "Announcement"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "AnnouncementRecipient_userId_idx" ON "AnnouncementRecipient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRecipient_announcementId_userId_key" ON "AnnouncementRecipient"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "News_status_publishedAt_idx" ON "News"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");

-- CreateIndex
CREATE INDEX "News_approvedById_idx" ON "News"("approvedById");

-- CreateIndex
CREATE INDEX "News_relatedSeriesId_idx" ON "News"("relatedSeriesId");

-- CreateIndex
CREATE INDEX "NewsTag_tagId_idx" ON "NewsTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsTag_newsId_tagId_key" ON "NewsTag"("newsId", "tagId");

-- CreateIndex
CREATE INDEX "PersonEnrichment_status_confidence_idx" ON "PersonEnrichment"("status", "confidence");

-- CreateIndex
CREATE INDEX "PersonEnrichment_entityType_entityId_idx" ON "PersonEnrichment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEnrichment_entityType_entityId_source_key" ON "PersonEnrichment"("entityType", "entityId", "source");

-- CreateIndex
CREATE INDEX "SupportThread_status_updatedAt_idx" ON "SupportThread"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportThread_userId_updatedAt_idx" ON "SupportThread"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_visibility_moderationHidden_createdAt_idx" ON "CommunityTopic"("visibility", "moderationHidden", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_kind_createdAt_idx" ON "CommunityTopic"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_seriesId_createdAt_idx" ON "CommunityTopic"("seriesId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityTopic_episodeId_idx" ON "CommunityTopic"("episodeId");

-- CreateIndex
CREATE INDEX "CommunityTopic_userId_createdAt_idx" ON "CommunityTopic"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_topicId_createdAt_idx" ON "CommunityReply"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_userId_createdAt_idx" ON "CommunityReply"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityProfile_publicId_key" ON "CommunityProfile"("publicId");

-- CreateIndex
CREATE INDEX "RecommendationList_userId_updatedAt_idx" ON "RecommendationList"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "RecommendationList_visibility_moderationHidden_publishedAt_idx" ON "RecommendationList"("visibility", "moderationHidden", "publishedAt");

-- CreateIndex
CREATE INDEX "RecommendationListItem_seriesId_idx" ON "RecommendationListItem"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationListItem_listId_seriesId_key" ON "RecommendationListItem"("listId", "seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationListItem_listId_position_key" ON "RecommendationListItem"("listId", "position");

-- CreateIndex
CREATE INDEX "CommunityFollow_topicId_notify_muted_idx" ON "CommunityFollow"("topicId", "notify", "muted");

-- CreateIndex
CREATE INDEX "CommunityBlock_targetId_idx" ON "CommunityBlock"("targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReport_reporterId_targetType_targetId_key" ON "CommunityReport"("reporterId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityModerationAction_reportId_createdAt_idx" ON "CommunityModerationAction"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "SeriesActivityDaily_seriesId_day_idx" ON "SeriesActivityDaily"("seriesId", "day");

-- CreateIndex
CREATE INDEX "SeriesFactVote_userId_idx" ON "SeriesFactVote"("userId");

-- CreateIndex
CREATE INDEX "SiteTrafficDaily_section_day_idx" ON "SiteTrafficDaily"("section", "day");

-- Extras de prisma/sqlite-extras.mjs (CHECKs, indices parciales, triggers)
CREATE TRIGGER IF NOT EXISTS "CommunitySettings_singleton_insert"
BEFORE INSERT ON "CommunitySettings"
WHEN NOT (NEW."id" = 1)
BEGIN
  SELECT RAISE(ABORT, 'CommunitySettings_singleton');
END;

CREATE TRIGGER IF NOT EXISTS "CommunitySettings_singleton_update"
BEFORE UPDATE ON "CommunitySettings"
WHEN NOT (NEW."id" = 1)
BEGIN
  SELECT RAISE(ABORT, 'CommunitySettings_singleton');
END;

CREATE TRIGGER IF NOT EXISTS "SupportSettings_singleton_insert"
BEFORE INSERT ON "SupportSettings"
WHEN NOT (NEW."id" = 1)
BEGIN
  SELECT RAISE(ABORT, 'SupportSettings_singleton');
END;

CREATE TRIGGER IF NOT EXISTS "SupportSettings_singleton_update"
BEFORE UPDATE ON "SupportSettings"
WHEN NOT (NEW."id" = 1)
BEGIN
  SELECT RAISE(ABORT, 'SupportSettings_singleton');
END;

CREATE TRIGGER IF NOT EXISTS "Series_main_story_requires_universe_insert"
BEFORE INSERT ON "Series"
WHEN NOT (NOT NEW."isUniverseMain" OR NEW."universeId" IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'Series_main_story_requires_universe');
END;

CREATE TRIGGER IF NOT EXISTS "Series_main_story_requires_universe_update"
BEFORE UPDATE ON "Series"
WHEN NOT (NOT NEW."isUniverseMain" OR NEW."universeId" IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'Series_main_story_requires_universe');
END;

CREATE TRIGGER IF NOT EXISTS "Series_contentRating_check_insert"
BEFORE INSERT ON "Series"
WHEN NOT (NEW."contentRating" IN ('UNREVIEWED', 'GENERAL', 'ADULT18'))
BEGIN
  SELECT RAISE(ABORT, 'Series_contentRating_check');
END;

CREATE TRIGGER IF NOT EXISTS "Series_contentRating_check_update"
BEFORE UPDATE ON "Series"
WHEN NOT (NEW."contentRating" IN ('UNREVIEWED', 'GENERAL', 'ADULT18'))
BEGIN
  SELECT RAISE(ABORT, 'Series_contentRating_check');
END;

CREATE TRIGGER IF NOT EXISTS "Series_contentWarnings_check_insert"
BEFORE INSERT ON "Series"
WHEN NOT (json_type(NEW."contentWarnings") = 'array' AND NOT EXISTS (SELECT 1 FROM json_each(NEW."contentWarnings") WHERE "value" NOT IN ('SEX', 'NUDITY', 'VIOLENCE', 'ABUSE', 'SELF_HARM')))
BEGIN
  SELECT RAISE(ABORT, 'Series_contentWarnings_check');
END;

CREATE TRIGGER IF NOT EXISTS "Series_contentWarnings_check_update"
BEFORE UPDATE ON "Series"
WHEN NOT (json_type(NEW."contentWarnings") = 'array' AND NOT EXISTS (SELECT 1 FROM json_each(NEW."contentWarnings") WHERE "value" NOT IN ('SEX', 'NUDITY', 'VIOLENCE', 'ABUSE', 'SELF_HARM')))
BEGIN
  SELECT RAISE(ABORT, 'Series_contentWarnings_check');
END;

CREATE TRIGGER IF NOT EXISTS "TrackingEvent_one_target_insert"
BEFORE INSERT ON "TrackingEvent"
WHEN NOT (((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1)
BEGIN
  SELECT RAISE(ABORT, 'TrackingEvent_one_target');
END;

CREATE TRIGGER IF NOT EXISTS "TrackingEvent_one_target_update"
BEFORE UPDATE ON "TrackingEvent"
WHEN NOT (((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1)
BEGIN
  SELECT RAISE(ABORT, 'TrackingEvent_one_target');
END;

CREATE TRIGGER IF NOT EXISTS "CommunityTopic_target_check_insert"
BEFORE INSERT ON "CommunityTopic"
WHEN NOT ((NEW."kind" = 'RECOMMENDATION' OR NEW."seriesId" IS NOT NULL) AND (NEW."episodeId" IS NULL OR (NEW."kind" = 'DISCUSSION' AND NEW."seriesId" IS NOT NULL)))
BEGIN
  SELECT RAISE(ABORT, 'CommunityTopic_target_check');
END;

CREATE TRIGGER IF NOT EXISTS "CommunityTopic_target_check_update"
BEFORE UPDATE ON "CommunityTopic"
WHEN NOT ((NEW."kind" = 'RECOMMENDATION' OR NEW."seriesId" IS NOT NULL) AND (NEW."episodeId" IS NULL OR (NEW."kind" = 'DISCUSSION' AND NEW."seriesId" IS NOT NULL)))
BEGIN
  SELECT RAISE(ABORT, 'CommunityTopic_target_check');
END;

CREATE TRIGGER IF NOT EXISTS "RecommendationListItem_position_check_insert"
BEFORE INSERT ON "RecommendationListItem"
WHEN NOT (NEW."position" >= 0 AND NEW."position" < 100)
BEGIN
  SELECT RAISE(ABORT, 'RecommendationListItem_position_check');
END;

CREATE TRIGGER IF NOT EXISTS "RecommendationListItem_position_check_update"
BEFORE UPDATE ON "RecommendationListItem"
WHEN NOT (NEW."position" >= 0 AND NEW."position" < 100)
BEGIN
  SELECT RAISE(ABORT, 'RecommendationListItem_position_check');
END;

CREATE TRIGGER IF NOT EXISTS "CommunityBlock_no_self_insert"
BEFORE INSERT ON "CommunityBlock"
WHEN NOT (NEW."userId" <> NEW."targetId")
BEGIN
  SELECT RAISE(ABORT, 'CommunityBlock_no_self');
END;

CREATE TRIGGER IF NOT EXISTS "CommunityBlock_no_self_update"
BEFORE UPDATE ON "CommunityBlock"
WHEN NOT (NEW."userId" <> NEW."targetId")
BEGIN
  SELECT RAISE(ABORT, 'CommunityBlock_no_self');
END;

CREATE TRIGGER IF NOT EXISTS "PilotClickDaily_clicks_check_insert"
BEFORE INSERT ON "PilotClickDaily"
WHEN NOT (NEW."clicks" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'PilotClickDaily_clicks_check');
END;

CREATE TRIGGER IF NOT EXISTS "PilotClickDaily_clicks_check_update"
BEFORE UPDATE ON "PilotClickDaily"
WHEN NOT (NEW."clicks" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'PilotClickDaily_clicks_check');
END;

CREATE TRIGGER IF NOT EXISTS "PilotClickDaily_placement_check_insert"
BEFORE INSERT ON "PilotClickDaily"
WHEN NOT (NEW."placement" IN ('series', 'platforms'))
BEGIN
  SELECT RAISE(ABORT, 'PilotClickDaily_placement_check');
END;

CREATE TRIGGER IF NOT EXISTS "PilotClickDaily_placement_check_update"
BEFORE UPDATE ON "PilotClickDaily"
WHEN NOT (NEW."placement" IN ('series', 'platforms'))
BEGIN
  SELECT RAISE(ABORT, 'PilotClickDaily_placement_check');
END;

CREATE TRIGGER IF NOT EXISTS "WatchLinkClickDaily_surface_check_insert"
BEFORE INSERT ON "WatchLinkClickDaily"
WHEN NOT (NEW."surface" IN ('series', 'info', 'watching'))
BEGIN
  SELECT RAISE(ABORT, 'WatchLinkClickDaily_surface_check');
END;

CREATE TRIGGER IF NOT EXISTS "WatchLinkClickDaily_surface_check_update"
BEFORE UPDATE ON "WatchLinkClickDaily"
WHEN NOT (NEW."surface" IN ('series', 'info', 'watching'))
BEGIN
  SELECT RAISE(ABORT, 'WatchLinkClickDaily_surface_check');
END;

CREATE TRIGGER IF NOT EXISTS "WatchLinkClickDaily_clicks_check_insert"
BEFORE INSERT ON "WatchLinkClickDaily"
WHEN NOT (NEW."clicks" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'WatchLinkClickDaily_clicks_check');
END;

CREATE TRIGGER IF NOT EXISTS "WatchLinkClickDaily_clicks_check_update"
BEFORE UPDATE ON "WatchLinkClickDaily"
WHEN NOT (NEW."clicks" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'WatchLinkClickDaily_clicks_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_kind_check_insert"
BEFORE INSERT ON "SeriesActivityDaily"
WHEN NOT (NEW."kind" IN ('view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on', 'open_ver', 'play_start', 'outbound_click', 'like', 'series_view'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_kind_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_kind_check_update"
BEFORE UPDATE ON "SeriesActivityDaily"
WHEN NOT (NEW."kind" IN ('view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on', 'open_ver', 'play_start', 'outbound_click', 'like', 'series_view'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_kind_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_source_check_insert"
BEFORE INSERT ON "SeriesActivityDaily"
WHEN NOT (NEW."source" IN ('account', 'browser'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_source_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_source_check_update"
BEFORE UPDATE ON "SeriesActivityDaily"
WHEN NOT (NEW."source" IN ('account', 'browser'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_source_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_count_check_insert"
BEFORE INSERT ON "SeriesActivityDaily"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesActivityDaily_count_check_update"
BEFORE UPDATE ON "SeriesActivityDaily"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SeriesActivityDaily_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_section_check_insert"
BEFORE INSERT ON "SiteTrafficDaily"
WHEN NOT (NEW."section" IN ('home', 'catalogo', 'ver', 'ver_player', 'series_detail', 'estrenos', 'comunidad', 'estadisticas', 'perfil', 'otros'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_section_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_section_check_update"
BEFORE UPDATE ON "SiteTrafficDaily"
WHEN NOT (NEW."section" IN ('home', 'catalogo', 'ver', 'ver_player', 'series_detail', 'estrenos', 'comunidad', 'estadisticas', 'perfil', 'otros'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_section_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_flow_check_insert"
BEFORE INSERT ON "SiteTrafficDaily"
WHEN NOT (NEW."flow" IN ('direct', 'internal', 'referral', 'share'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_flow_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_flow_check_update"
BEFORE UPDATE ON "SiteTrafficDaily"
WHEN NOT (NEW."flow" IN ('direct', 'internal', 'referral', 'share'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_flow_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_source_check_insert"
BEFORE INSERT ON "SiteTrafficDaily"
WHEN NOT (NEW."source" IN ('account', 'browser'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_source_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_source_check_update"
BEFORE UPDATE ON "SiteTrafficDaily"
WHEN NOT (NEW."source" IN ('account', 'browser'))
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_source_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_count_check_insert"
BEFORE INSERT ON "SiteTrafficDaily"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SiteTrafficDaily_count_check_update"
BEFORE UPDATE ON "SiteTrafficDaily"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SiteTrafficDaily_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesReactionCount_reaction_check_insert"
BEFORE INSERT ON "SeriesReactionCount"
WHEN NOT (NEW."reaction" IN ('laugh', 'love', 'fire', 'cry', 'mindblown', 'clap', 'wow', 'hot', 'smirk', 'kiss'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesReactionCount_reaction_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesReactionCount_reaction_check_update"
BEFORE UPDATE ON "SeriesReactionCount"
WHEN NOT (NEW."reaction" IN ('laugh', 'love', 'fire', 'cry', 'mindblown', 'clap', 'wow', 'hot', 'smirk', 'kiss'))
BEGIN
  SELECT RAISE(ABORT, 'SeriesReactionCount_reaction_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesReactionCount_count_check_insert"
BEFORE INSERT ON "SeriesReactionCount"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SeriesReactionCount_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesReactionCount_count_check_update"
BEFORE UPDATE ON "SeriesReactionCount"
WHEN NOT (NEW."count" >= 0)
BEGIN
  SELECT RAISE(ABORT, 'SeriesReactionCount_count_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesFactVote_fact_value_check_insert"
BEFORE INSERT ON "SeriesFactVote"
WHEN NOT ((NEW."fact" = 'kiss' AND NEW."value" IN ('none', 'yes', 'several')) OR (NEW."fact" = 'intimacy' AND NEW."value" IN ('none', 'implied', 'shown')) OR (NEW."fact" = 'together' AND NEW."value" IN ('yes', 'no', 'open')) OR (NEW."fact" = 'ending' AND NEW."value" IN ('happy', 'sad', 'bittersweet')) OR (NEW."fact" = 'drama' AND NEW."value" IN ('light', 'medium', 'heavy')) OR (NEW."fact" = 'sidecouple' AND NEW."value" IN ('yes', 'no')) OR (NEW."fact" = 'triangle' AND NEW."value" IN ('yes', 'no')))
BEGIN
  SELECT RAISE(ABORT, 'SeriesFactVote_fact_value_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesFactVote_fact_value_check_update"
BEFORE UPDATE ON "SeriesFactVote"
WHEN NOT ((NEW."fact" = 'kiss' AND NEW."value" IN ('none', 'yes', 'several')) OR (NEW."fact" = 'intimacy' AND NEW."value" IN ('none', 'implied', 'shown')) OR (NEW."fact" = 'together' AND NEW."value" IN ('yes', 'no', 'open')) OR (NEW."fact" = 'ending' AND NEW."value" IN ('happy', 'sad', 'bittersweet')) OR (NEW."fact" = 'drama' AND NEW."value" IN ('light', 'medium', 'heavy')) OR (NEW."fact" = 'sidecouple' AND NEW."value" IN ('yes', 'no')) OR (NEW."fact" = 'triangle' AND NEW."value" IN ('yes', 'no')))
BEGIN
  SELECT RAISE(ABORT, 'SeriesFactVote_fact_value_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesFactOverride_fact_value_check_insert"
BEFORE INSERT ON "SeriesFactOverride"
WHEN NOT ((NEW."fact" = 'kiss' AND NEW."value" IN ('none', 'yes', 'several')) OR (NEW."fact" = 'intimacy' AND NEW."value" IN ('none', 'implied', 'shown')) OR (NEW."fact" = 'together' AND NEW."value" IN ('yes', 'no', 'open')) OR (NEW."fact" = 'ending' AND NEW."value" IN ('happy', 'sad', 'bittersweet')) OR (NEW."fact" = 'drama' AND NEW."value" IN ('light', 'medium', 'heavy')) OR (NEW."fact" = 'sidecouple' AND NEW."value" IN ('yes', 'no')) OR (NEW."fact" = 'triangle' AND NEW."value" IN ('yes', 'no')))
BEGIN
  SELECT RAISE(ABORT, 'SeriesFactOverride_fact_value_check');
END;

CREATE TRIGGER IF NOT EXISTS "SeriesFactOverride_fact_value_check_update"
BEFORE UPDATE ON "SeriesFactOverride"
WHEN NOT ((NEW."fact" = 'kiss' AND NEW."value" IN ('none', 'yes', 'several')) OR (NEW."fact" = 'intimacy' AND NEW."value" IN ('none', 'implied', 'shown')) OR (NEW."fact" = 'together' AND NEW."value" IN ('yes', 'no', 'open')) OR (NEW."fact" = 'ending' AND NEW."value" IN ('happy', 'sad', 'bittersweet')) OR (NEW."fact" = 'drama' AND NEW."value" IN ('light', 'medium', 'heavy')) OR (NEW."fact" = 'sidecouple' AND NEW."value" IN ('yes', 'no')) OR (NEW."fact" = 'triangle' AND NEW."value" IN ('yes', 'no')))
BEGIN
  SELECT RAISE(ABORT, 'SeriesFactOverride_fact_value_check');
END;

CREATE UNIQUE INDEX IF NOT EXISTS "Series_one_main_story_per_universe" ON "Series" ("universeId") WHERE "isUniverseMain" = 1;

CREATE UNIQUE INDEX IF NOT EXISTS "RecommendationList_one_top_five" ON "RecommendationList" ("userId") WHERE "kind" = 'TOP_FIVE';

CREATE TRIGGER IF NOT EXISTS "ViewStatus_tracking_history_insert"
AFTER INSERT ON "ViewStatus"
WHEN NEW."userId" IS NOT NULL AND ((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1
  AND NOT (NEW."status" = 'SIN_VER' AND NEW."watchedDate" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "Lease" WHERE "key" = 'tracking-restore:' || NEW."userId" AND "expiresAt" > strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now'))
BEGIN
  INSERT INTO "TrackingEvent" ("id", "userId", "kind", "status", "previousStatus", "watchedDate", "previousWatchedDate", "recordedAt", "seriesId", "seasonId", "episodeId")
  VALUES (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))), NEW."userId", 'RECORDED', NEW."status", NULL, NEW."watchedDate", NULL, strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now'), NEW."seriesId", NEW."seasonId", NEW."episodeId");
END;

CREATE TRIGGER IF NOT EXISTS "ViewStatus_tracking_history_update"
AFTER UPDATE ON "ViewStatus"
WHEN NEW."userId" IS NOT NULL AND ((NEW."seriesId" IS NOT NULL) + (NEW."seasonId" IS NOT NULL) + (NEW."episodeId" IS NOT NULL)) = 1
  AND ((OLD."userId" IS NOT NEW."userId" OR OLD."seriesId" IS NOT NEW."seriesId" OR OLD."seasonId" IS NOT NEW."seasonId" OR OLD."episodeId" IS NOT NEW."episodeId") OR OLD."status" IS NOT NEW."status" OR OLD."watchedDate" IS NOT NEW."watchedDate")
  AND NOT EXISTS (SELECT 1 FROM "Lease" WHERE "key" = 'tracking-restore:' || NEW."userId" AND "expiresAt" > strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now'))
BEGIN
  INSERT INTO "TrackingEvent" ("id", "userId", "kind", "status", "previousStatus", "watchedDate", "previousWatchedDate", "recordedAt", "seriesId", "seasonId", "episodeId")
  VALUES (
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))), NEW."userId",
    CASE WHEN (OLD."userId" IS NOT NEW."userId" OR OLD."seriesId" IS NOT NEW."seriesId" OR OLD."seasonId" IS NOT NEW."seasonId" OR OLD."episodeId" IS NOT NEW."episodeId") THEN 'RECORDED' WHEN OLD."status" IS NOT NEW."status" THEN 'STATUS_CHANGED' ELSE 'DATE_CHANGED' END,
    NEW."status",
    CASE WHEN (OLD."userId" IS NOT NEW."userId" OR OLD."seriesId" IS NOT NEW."seriesId" OR OLD."seasonId" IS NOT NEW."seasonId" OR OLD."episodeId" IS NOT NEW."episodeId") THEN NULL ELSE OLD."status" END,
    NEW."watchedDate",
    CASE WHEN (OLD."userId" IS NOT NEW."userId" OR OLD."seriesId" IS NOT NEW."seriesId" OR OLD."seasonId" IS NOT NEW."seasonId" OR OLD."episodeId" IS NOT NEW."episodeId") THEN NULL ELSE OLD."watchedDate" END,
    strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now'), NEW."seriesId", NEW."seasonId", NEW."episodeId"
  );
END;
