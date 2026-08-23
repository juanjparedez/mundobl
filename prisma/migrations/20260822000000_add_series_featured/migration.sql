-- Curaduria editorial: permite a Flor (o cualquier ADMIN/MODERATOR) marcar
-- una serie como "destacada" para el filtro "Destacadas" de /catalogo, con
-- orden manual opcional.
--
-- NOTA: aplicada a mano via script (pg directo) el 2026-08-22 porque
-- `prisma migrate dev` detecto drift preexistente entre este historial de
-- migraciones y la base real (tablas SeriesNote/SeriesSuggestion y varias
-- columnas ya existian en prod sin migracion asociada) y ofrecia resetear
-- la base para reconciliar. Este archivo documenta el cambio sin intentar
-- arreglar ese drift preexistente — si en algun momento se reconcilia el
-- historial completo, confirmar que esta migracion ya esta aplicada antes
-- de correr `prisma migrate deploy` (o marcarla con `prisma migrate resolve
-- --applied`).

ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Series_featured_featuredOrder_idx" ON "Series"("featured", "featuredOrder");
