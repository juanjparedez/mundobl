-- Enable Row Level Security on the public tables that were created AFTER the
-- initial blanket migration (20260501080108_enable_rls) and therefore never
-- received RLS. Supabase Security Advisor ("rls_disabled_in_public") flags
-- exactly these.
--
-- App context (same as 20260501080108_enable_rls):
--   - Prisma se conecta con DATABASE_URL/DIRECT_URL usando el rol owner
--     (postgres en Supabase), que tiene BYPASSRLS: estas policies no lo afectan.
--   - El frontend NO usa supabase-js para queries a tablas. supabase-js solo
--     corre server-side con SUPABASE_SERVICE_ROLE_KEY (que tambien bypassea RLS)
--     y unicamente para Storage (bucket "images").
--   - La anon/publishable key no se usa para leer/escribir ninguna tabla.
--
-- Resultado: activar RLS sin policies cierra el acceso publico via PostgREST
-- (roles "anon"/"authenticated") sin romper la app (Prisma usa el rol owner).

-- =====================================================
-- DATOS PRIVADOS DE USUARIO (sensibles)
-- =====================================================
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;   -- endpoints + claves p256dh/auth de Web Push
ALTER TABLE "NotificationPrefs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EpisodeNote" ENABLE ROW LEVEL SECURITY;         -- notas privadas por usuario
ALTER TABLE "SeriesSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserDashboardLayout" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MODERACION Y FEEDBACK
-- =====================================================
ALTER TABLE "CommentReport" ENABLE ROW LEVEL SECURITY;       -- reportes de moderacion
ALTER TABLE "FeatureRequestComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewVote" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONTENIDO EDITORIAL / CACHE
-- =====================================================
ALTER TABLE "News" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChangelogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeriesInfoBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmbedPreviewCache" ENABLE ROW LEVEL SECURITY;
