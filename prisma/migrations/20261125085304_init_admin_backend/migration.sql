-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "PlacementBranch" AS ENUM ('NTL', 'XVNT');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementAttempt" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "branch" "PlacementBranch" NOT NULL,
    "testLabel" TEXT NOT NULL,
    "testSlug" TEXT NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "scoreCorrect" INTEGER,
    "scoreTotal" INTEGER,
    "scorePercent" DOUBLE PRECISION,
    "detailUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_username_idx" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementAttempt_externalId_key" ON "PlacementAttempt"("externalId");

-- CreateIndex
CREATE INDEX "PlacementAttempt_finishedAt_idx" ON "PlacementAttempt"("finishedAt");

-- CreateIndex
CREATE INDEX "PlacementAttempt_branch_finishedAt_idx" ON "PlacementAttempt"("branch", "finishedAt");

-- CreateIndex
CREATE INDEX "PlacementAttempt_studentName_idx" ON "PlacementAttempt"("studentName");
