-- CreateEnum
CREATE TYPE "UserApprovalStatus" AS ENUM ('PENDING_PLAN', 'PENDING_APPROVAL', 'APPROVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "approvalStatus" "UserApprovalStatus" NOT NULL DEFAULT 'PENDING_PLAN';

-- Existing admins and users that already have a plan should keep working.
UPDATE "User"
SET "approvalStatus" = 'APPROVED'
WHERE "role" = 'ADMIN' OR "planId" IS NOT NULL;
