-- Migration script to update from Policy to PolicyTemplate + PolicyInstance structure

-- First, create the new tables
CREATE TABLE IF NOT EXISTS "PolicyTemplate" (
    "id" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PolicyInstance" (
    "id" TEXT NOT NULL,
    "policyTemplateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "premiumAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyInstance_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PolicyTemplate_policyNumber_key" ON "PolicyTemplate"("policyNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PolicyInstance_policyTemplateId_clientId_key" ON "PolicyInstance"("policyTemplateId", "clientId");

-- Add foreign key constraints
ALTER TABLE "PolicyInstance" ADD CONSTRAINT "PolicyInstance_policyTemplateId_fkey" FOREIGN KEY ("policyTemplateId") REFERENCES "PolicyTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyInstance" ADD CONSTRAINT "PolicyInstance_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data from Policy table to new structure
-- First, create policy templates from unique policies
INSERT INTO "PolicyTemplate" ("id", "policyNumber", "policyType", "provider", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as id,
    "policyNumber",
    "policyType",
    "provider",
    MIN("createdAt") as "createdAt",
    NOW() as "updatedAt"
FROM "Policy"
GROUP BY "policyNumber", "policyType", "provider"
ON CONFLICT ("policyNumber") DO NOTHING;

-- Then create policy instances
INSERT INTO "PolicyInstance" ("id", "policyTemplateId", "clientId", "premiumAmount", "status", "startDate", "expiryDate", "commissionAmount", "createdAt", "updatedAt")
SELECT 
    p."id",
    pt."id" as "policyTemplateId",
    p."clientId",
    p."premiumAmount",
    p."status",
    p."startDate",
    p."expiryDate",
    p."commissionAmount",
    p."createdAt",
    p."updatedAt"
FROM "Policy" p
JOIN "PolicyTemplate" pt ON pt."policyNumber" = p."policyNumber" AND pt."policyType" = p."policyType" AND pt."provider" = p."provider"
ON CONFLICT ("policyTemplateId", "clientId") DO NOTHING;

-- Update Client table to reference PolicyInstance instead of Policy
-- This will be handled by the schema update

-- Note: Don't drop the Policy table yet - we'll do that after confirming everything works