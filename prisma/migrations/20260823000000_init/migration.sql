-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'HOSPITAL', 'BLOOD_BANK', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('HOSPITAL', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('Code Red: Urgent', 'High', 'Moderate');

-- CreateEnum
CREATE TYPE "EmergencyCategory" AS ENUM ('Trauma', 'Pediatric Trauma', 'Platelet/Oncology', 'Postpartum', 'Surgical');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('ACCEPTED', 'DECLINED', 'ARRIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('Whole Blood', 'Platelets (Apheresis)', 'Plasma');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('Open', 'Under Review', 'Resolved', 'Rejected');

-- CreateEnum
CREATE TYPE "ComplaintTargetType" AS ENUM ('USER', 'HOSPITAL', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('In Transit', 'Arrived', 'Loading');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('STOCK', 'EMERGENCY', 'LOGISTICS', 'DONOR', 'SYSTEM', 'AUTH');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'CRITICAL', 'SUCCESS', 'WARNING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "locationAddress" TEXT,
    "locationCity" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "livesImpacted" INTEGER NOT NULL DEFAULT 0,
    "lastDonationDate" TIMESTAMP(3),
    "isAvailableToDonate" BOOLEAN NOT NULL DEFAULT true,
    "weightKg" DOUBLE PRECISION,
    "hemoglobin" DOUBLE PRECISION,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "digitalIdHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'HOSPITAL',
    "registrationNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactPersonDesignation" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "banReason" TEXT,
    "facilityType" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_inventories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood_inventories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "blood_inventories_quantity_non_negative" CHECK ("quantity" >= 0)
);

-- CreateTable
CREATE TABLE "blood_stock_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "delta" INTEGER NOT NULL,
    "previousQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "reason" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blood_stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT,
    "bloodType" "BloodGroup" NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'High',
    "category" "EmergencyCategory" NOT NULL DEFAULT 'Trauma',
    "hospitalName" TEXT NOT NULL,
    "department" TEXT,
    "address" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bagsNeeded" INTEGER NOT NULL,
    "bagsFulfilled" INTEGER NOT NULL DEFAULT 0,
    "patientInitials" TEXT NOT NULL,
    "patientAge" INTEGER,
    "contactPhone" TEXT NOT NULL,
    "criticalNote" TEXT,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_donor_responses" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "donorUserId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'ACCEPTED',
    "etaMinutes" INTEGER,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_donor_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_records" (
    "id" TEXT NOT NULL,
    "donorUserId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsDonated" INTEGER NOT NULL DEFAULT 1,
    "donationType" "DonationType" NOT NULL DEFAULT 'Whole Blood',
    "certificateId" TEXT NOT NULL,
    "verificationHash" TEXT NOT NULL,
    "livesImpacted" INTEGER NOT NULL DEFAULT 3,
    "donationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "targetType" "ComplaintTargetType" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceFileName" TEXT,
    "evidenceFileUrl" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'Open',
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "couriers_telemetry" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "destinationOrgId" TEXT NOT NULL,
    "currentLat" DOUBLE PRECISION NOT NULL,
    "currentLng" DOUBLE PRECISION NOT NULL,
    "tempCelsius" DOUBLE PRECISION NOT NULL,
    "status" "CourierStatus" NOT NULL DEFAULT 'In Transit',
    "cargoDescription" TEXT NOT NULL,
    "bloodUnits" INTEGER NOT NULL DEFAULT 0,
    "headingDeg" INTEGER NOT NULL DEFAULT 0,
    "etaMinutes" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "category" "ActivityCategory" NOT NULL DEFAULT 'SYSTEM',
    "severity" "ActivitySeverity" NOT NULL DEFAULT 'INFO',
    "eventText" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "donor_profiles_userId_key" ON "donor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_registrationNumber_key" ON "organizations"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "blood_inventories_organizationId_bloodGroup_key" ON "blood_inventories"("organizationId", "bloodGroup");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_donor_responses_alertId_donorUserId_key" ON "emergency_donor_responses"("alertId", "donorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_records_certificateId_key" ON "donation_records"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_telemetry_vehicleId_key" ON "couriers_telemetry"("vehicleId");

-- AddForeignKey
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_inventories" ADD CONSTRAINT "blood_inventories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_stock_transactions" ADD CONSTRAINT "blood_stock_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_stock_transactions" ADD CONSTRAINT "blood_stock_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_donor_responses" ADD CONSTRAINT "emergency_donor_responses_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "emergency_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_donor_responses" ADD CONSTRAINT "emergency_donor_responses_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_records" ADD CONSTRAINT "donation_records_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_records" ADD CONSTRAINT "donation_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couriers_telemetry" ADD CONSTRAINT "couriers_telemetry_destinationOrgId_fkey" FOREIGN KEY ("destinationOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
