-- AlterTable: add password reset fields to User
ALTER TABLE "gonzapp_webservice"."User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "gonzapp_webservice"."User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
