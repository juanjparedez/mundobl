-- CreateTable
CREATE TABLE "ChangelogItem" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "category" TEXT,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangelogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangelogItem_version_sortOrder_idx" ON "ChangelogItem"("version", "sortOrder");
