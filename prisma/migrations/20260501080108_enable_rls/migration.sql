-- Enable Row Level Security on all public tables.
--
-- App context:
--   - Prisma se conecta con DATABASE_URL/DIRECT_URL usando el rol owner
--     (postgres en Supabase), que tiene BYPASSRLS y por lo tanto no se ve
--     afectado por estas policies.
--   - El frontend NO usa supabase-js para queries a tablas. supabase-js solo
--     se usa server-side con SUPABASE_SERVICE_ROLE_KEY y unicamente para
--     Storage (bucket "images"). El service_role tambien bypassea RLS.
--   - La anon/publishable key no se usa para leer ninguna tabla. Por lo tanto,
--     activar RLS sin policies cierra el acceso publico via PostgREST sin
--     romper la app.
--
-- Resultado: cualquier intento de leer/escribir tablas con la anon key
-- (rol "anon") o con un JWT de usuario (rol "authenticated") falla. La app
-- sigue funcionando porque Prisma usa el rol owner.

-- =====================================================
-- AUTENTICACION (criticas: contienen tokens y emails)
-- =====================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DATOS DE USUARIO (privados)
-- =====================================================
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserFavorite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ViewStatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeatureRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeatureRequestImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeatureVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SuggestedSite" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LOGS Y SEGURIDAD (sensibles: IPs, user agents)
-- =====================================================
ALTER TABLE "AccessLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BannedIp" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CATALOGO (no son sensibles pero igual no expongas via REST)
-- =====================================================
ALTER TABLE "Series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Season" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Episode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Actor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Director" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Country" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Genre" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Universe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Language" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductionCompany" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLAS DE RELACION
-- =====================================================
ALTER TABLE "SeriesActor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeasonActor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesDirector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesGenre" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesDubbing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RelatedSeries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONTENIDO
-- =====================================================
ALTER TABLE "WatchLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmbeddableContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecommendedSite" ENABLE ROW LEVEL SECURITY;
