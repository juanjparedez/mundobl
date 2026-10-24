-- Depende de 20261024190000_tracking_redesign (crea SeriesActivityDaily y su
-- CHECK de kind). Aplicar esa primero.

-- AlterTable
-- Solo una columna en una tabla que ya tiene RLS: no hace falta politica nueva.
ALTER TABLE "NotificationPrefs" ADD COLUMN     "digestSentAt" TIMESTAMP(3);

-- Embudo del aviso de estreno (AiringAlertCta): mismos contadores anonimos.
ALTER TABLE "SeriesActivityDaily" DROP CONSTRAINT "SeriesActivityDaily_kind_check";
ALTER TABLE "SeriesActivityDaily" ADD CONSTRAINT "SeriesActivityDaily_kind_check" CHECK ("kind" IN ('view', 'chapter', 'want', 'finish', 'alert_offer', 'alert_click', 'alert_on'));
