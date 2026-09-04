-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "transliteration" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "commonMistake" TEXT,
    "examples" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlossaryTermTag" (
    "id" SERIAL NOT NULL,
    "glossaryTermId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "GlossaryTermTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_slug_key" ON "GlossaryTerm"("slug");

-- CreateIndex
CREATE INDEX "GlossaryTerm_status_country_category_idx" ON "GlossaryTerm"("status", "country", "category");

-- CreateIndex
CREATE INDEX "GlossaryTerm_status_publishedAt_idx" ON "GlossaryTerm"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTermTag_glossaryTermId_tagId_key" ON "GlossaryTermTag"("glossaryTermId", "tagId");

-- CreateIndex
CREATE INDEX "GlossaryTermTag_tagId_idx" ON "GlossaryTermTag"("tagId");

-- AddForeignKey
ALTER TABLE "GlossaryTermTag" ADD CONSTRAINT "GlossaryTermTag_glossaryTermId_fkey" FOREIGN KEY ("glossaryTermId") REFERENCES "GlossaryTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlossaryTermTag" ADD CONSTRAINT "GlossaryTermTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;