-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gonzapp_webservice";

-- CreateEnum
CREATE TYPE "gonzapp_webservice"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "gonzapp_webservice"."ListingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "gonzapp_webservice"."UserApprovalStatus" AS ENUM ('PENDING_PLAN', 'PENDING_APPROVAL', 'APPROVED');

-- CreateTable
CREATE TABLE "gonzapp_webservice"."Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "maxImages" INTEGER NOT NULL,
    "daysActive" INTEGER NOT NULL,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gonzapp_webservice"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "gonzapp_webservice"."Role" NOT NULL DEFAULT 'USER',
    "approvalStatus" "gonzapp_webservice"."UserApprovalStatus" NOT NULL DEFAULT 'PENDING_PLAN',
    "planId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gonzapp_webservice"."Listing" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "fuel" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "equipment" TEXT[],
    "priceArs" DOUBLE PRECISION NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "images" TEXT[],
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "gonzapp_webservice"."ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "gonzapp_webservice"."User"("email");

-- AddForeignKey
ALTER TABLE "gonzapp_webservice"."User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "gonzapp_webservice"."Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gonzapp_webservice"."Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gonzapp_webservice"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
