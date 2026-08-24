-- Aviso de restriccion regional en /ver: permite marcar una serie como
-- bloqueada en el mercado core del sitio (AR/MX/ES/CL/CO/PE/US) para
-- mostrar un aviso ANTES de que el usuario haga click y se encuentre con
-- "video no disponible en tu pais". Snapshot manual via YouTube Data API
-- (contentDetails.regionRestriction), no se re-chequea solo.
--
-- NOTA: aplicada a mano via script (pg directo) el 2026-08-24, mismo
-- motivo que 20260822000000_add_series_featured — el historial de
-- migraciones tiene drift preexistente con la DB real.

ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "geoRestrictedCore" BOOLEAN NOT NULL DEFAULT false;
