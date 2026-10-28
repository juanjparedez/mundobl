-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","key")
);

-- CreateIndex
CREATE INDEX "UserAchievement_key_idx" ON "UserAchievement"("key");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Server-only; no public PostgREST policy.
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;

-- Los logros que cada usuario ya cumple los carga scripts/backfill-achievements.ts,
-- que npm run migrate:supabase corre justo despues de aplicar esta migracion
-- (las metricas de capitulos y horas viven en TypeScript, no en SQL).
