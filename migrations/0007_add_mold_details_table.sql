-- Migration: Add mold_details table
-- Date: 2025-02-23
-- Description: Creates a dedicated table for saving individual mold details that can be reused

CREATE TABLE IF NOT EXISTS "mold_details" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "partName" TEXT,
  "mouldNo" TEXT,
  "plasticMaterial" TEXT,
  "colourChange" TEXT,
  "mfi" TEXT,
  "wallThickness" TEXT,
  "noOfCavity" INTEGER,
  "gfPercent" TEXT,
  "mfPercent" TEXT,
  "partWeight" NUMERIC,
  "systemSuggested" TEXT,
  "noOfDrops" INTEGER,
  "trialDate" DATE,
  "quotationFor" TEXT,
  "userId" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "mold_details_user_id_idx" ON "mold_details"("userId");
CREATE INDEX IF NOT EXISTS "mold_details_created_at_idx" ON "mold_details"("createdAt");
