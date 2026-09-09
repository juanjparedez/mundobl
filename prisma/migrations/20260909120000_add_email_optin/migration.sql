-- AlterTable
-- IF NOT EXISTS porque estas columnas ya existian en produccion cuando se
-- corrio la migracion (se aplicaron a mano por fuera de Prisma), y sin esto
-- el ALTER aborta con 42701 y deja el historial de migraciones trabado.
ALTER TABLE "NotificationPrefs" ADD COLUMN IF NOT EXISTS "emailEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3);
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "emailSentCount" INTEGER;
