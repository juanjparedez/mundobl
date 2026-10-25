-- CreateTable
CREATE TABLE "SiteTrafficDaily" (
    "day" DATE NOT NULL,
    "section" TEXT NOT NULL,
    "flow" TEXT NOT NULL DEFAULT 'direct',
    "source" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteTrafficDaily_pkey" PRIMARY KEY ("day","section","flow","source","country")
);

-- CreateIndex
CREATE INDEX "SiteTrafficDaily_section_day_idx" ON "SiteTrafficDaily"("section", "day");

-- Server-only; no public PostgREST policy.
ALTER TABLE "SiteTrafficDaily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteTrafficDaily" ADD CONSTRAINT "SiteTrafficDaily_section_check" CHECK ("section" IN ('home', 'catalogo', 'ver', 'ver_player', 'series_detail', 'estrenos', 'comunidad', 'estadisticas', 'perfil', 'otros'));
ALTER TABLE "SiteTrafficDaily" ADD CONSTRAINT "SiteTrafficDaily_flow_check" CHECK ("flow" IN ('direct', 'internal', 'referral', 'share'));
ALTER TABLE "SiteTrafficDaily" ADD CONSTRAINT "SiteTrafficDaily_source_check" CHECK ("source" IN ('account', 'browser'));
ALTER TABLE "SiteTrafficDaily" ADD CONSTRAINT "SiteTrafficDaily_count_check" CHECK ("count" >= 0);

-- Ampliacion de kinds para SeriesActivityDaily: open_ver, play_start, outbound_click, like
ALTER TABLE "SeriesActivityDaily" DROP CONSTRAINT "SeriesActivityDaily_kind_check";
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_kind_check" CHECK ("kind" IN ('view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on', 'open_ver', 'play_start', 'outbound_click', 'like'));
