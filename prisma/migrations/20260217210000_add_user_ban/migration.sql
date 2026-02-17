-- AlterTable
ALTER TABLE "User" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BannedIp" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedIp_ip_key" ON "BannedIp"("ip");
