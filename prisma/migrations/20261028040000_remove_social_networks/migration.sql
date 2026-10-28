-- MundoBL no enlaza ni integra redes sociales. Esta migracion borra los
-- datos y columnas que quedaban de Twitter/X, Instagram, Facebook, TikTok
-- y Reddit. WhatsApp y Telegram siguen como canales de compartir.

-- Columnas de perfil social en personas (nunca se escribieron).
ALTER TABLE "Actor" DROP COLUMN "instagramUrl",
DROP COLUMN "xUrl";

ALTER TABLE "Director" DROP COLUMN "instagramUrl",
DROP COLUMN "xUrl";

-- Sitios recomendados que son perfiles o comunidades de redes sociales
-- (BLUPDATE en Twitter y los subreddits de /sitios).
DELETE FROM "RecommendedSite"
WHERE "url" ~* '^https?://([a-z0-9-]+\.)*(twitter\.com|x\.com|facebook\.com|fb\.com|instagram\.com|tiktok\.com|threads\.net|bsky\.app|reddit\.com)(/|$)';

-- Embeds de plataformas que ya no se soportan.
DELETE FROM "EmbeddableContent"
WHERE "platform" IN ('TikTok', 'Instagram', 'Twitter');

-- Canales de compartir eliminados.
DELETE FROM "SeriesShare"
WHERE "channel" IN ('twitter', 'facebook');

-- Handles de redes sociales en el perfil del usuario.
UPDATE "User"
SET "socials" = NULLIF(("socials"::jsonb - 'twitter' - 'instagram'), '{}'::jsonb)
WHERE "socials" IS NOT NULL
  AND jsonb_typeof("socials"::jsonb) = 'object'
  AND ("socials"::jsonb ? 'twitter' OR "socials"::jsonb ? 'instagram');
