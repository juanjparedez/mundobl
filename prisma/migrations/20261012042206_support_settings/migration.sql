-- CreateTable
CREATE TABLE "SupportSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "draft" JSONB NOT NULL,
    "published" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportSettings" ADD CONSTRAINT "SupportSettings_singleton" CHECK (id = 1);
