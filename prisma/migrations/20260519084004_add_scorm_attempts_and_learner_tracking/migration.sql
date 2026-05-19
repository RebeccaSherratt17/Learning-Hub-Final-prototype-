/*
  Warnings:

  - You are about to drop the column `scormCourseId` on the `courses` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PASSED', 'FAILED');

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "scormCourseId",
ADD COLUMN     "credlyBadgeId" TEXT,
ADD COLUMN     "launchFile" TEXT,
ADD COLUMN     "scormVersion" TEXT,
ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "learning_path_items" ADD COLUMN     "isElective" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "milestoneTitle" TEXT,
ALTER COLUMN "contentType" DROP NOT NULL,
ALTER COLUMN "contentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "learning_paths" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "credlyBadgeId" TEXT,
ADD COLUMN     "fileSize" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "credlyBadgeId" TEXT,
ADD COLUMN     "sku" TEXT;

-- CreateTable
CREATE TABLE "gate_submissions" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preview_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preview_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerEmail" TEXT NOT NULL,
    "learnerFirstName" TEXT NOT NULL,
    "learnerLastName" TEXT,
    "launchToken" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "timeSpentSeconds" INTEGER,
    "completedAt" TIMESTAMP(3),
    "rawCmi" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gate_submissions_email_idx" ON "gate_submissions"("email");

-- CreateIndex
CREATE INDEX "gate_submissions_createdAt_idx" ON "gate_submissions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "preview_tokens_token_key" ON "preview_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_launchToken_key" ON "attempts"("launchToken");

-- CreateIndex
CREATE INDEX "attempts_courseId_idx" ON "attempts"("courseId");

-- CreateIndex
CREATE INDEX "attempts_learnerEmail_idx" ON "attempts"("learnerEmail");
