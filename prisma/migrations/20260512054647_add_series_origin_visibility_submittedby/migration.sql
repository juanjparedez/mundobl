-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'CURATED',
ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'VISIBLE';

-- CreateIndex
CREATE INDEX "Series_origin_visibility_idx" ON "Series"("origin", "visibility");

-- CreateIndex
CREATE INDEX "Series_submittedById_createdAt_idx" ON "Series"("submittedById", "createdAt");

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
