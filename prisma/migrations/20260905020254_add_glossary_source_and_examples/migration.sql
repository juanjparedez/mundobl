-- AlterTable
ALTER TABLE "GlossarySuggestion" ADD COLUMN     "commonMistake" TEXT,
ADD COLUMN     "examples" TEXT;

-- AlterTable
ALTER TABLE "GlossaryTerm" ADD COLUMN     "sourceName" TEXT,
ADD COLUMN     "sourceUrl" TEXT;
