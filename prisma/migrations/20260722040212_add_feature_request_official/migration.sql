-- AlterTable
ALTER TABLE "FeatureRequest" ADD COLUMN     "official" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: los items existentes sin autor son los sembrados por
-- seed-feature-requests.ts (roadmap del equipo). Las solicitudes de la
-- comunidad siempre tienen userId (el endpoint POST exige auth), por lo que
-- en este momento userId IS NULL identifica univocamente al roadmap.
UPDATE "FeatureRequest" SET "official" = true WHERE "userId" IS NULL;
