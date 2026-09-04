-- CreateTable
CREATE TABLE "GlossarySuggestion" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "transliteration" TEXT,
    "country" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT NOT NULL DEFAULT 'fandom',
    "meaning" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossarySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlossarySuggestion_status_userId_idx" ON "GlossarySuggestion"("status", "userId");

-- CreateIndex
CREATE INDEX "GlossarySuggestion_createdAt_idx" ON "GlossarySuggestion"("createdAt");

-- AddForeignKey
ALTER TABLE "GlossarySuggestion" ADD CONSTRAINT "GlossarySuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;