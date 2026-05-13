-- AlterTable
ALTER TABLE "Director" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "awards" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "imdbUrl" TEXT,
ADD COLUMN     "mdlUrl" TEXT,
ADD COLUMN     "wikiUrl" TEXT;
