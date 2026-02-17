-- CreateTable
CREATE TABLE "FeatureRequestImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "featureRequestId" INTEGER NOT NULL,

    CONSTRAINT "FeatureRequestImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeatureRequestImage" ADD CONSTRAINT "FeatureRequestImage_featureRequestId_fkey" FOREIGN KEY ("featureRequestId") REFERENCES "FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
