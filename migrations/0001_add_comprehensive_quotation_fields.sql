-- Migration: Add comprehensive quotation fields
-- Date: 2025-01-XX

-- Create GST type enum
CREATE TYPE IF NOT EXISTS gst_type AS ENUM ('IGST', 'CGST_SGST');

-- Add new fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS company VARCHAR(150),
ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- Add new fields to outbound_quotations table

-- GST fields
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "gstType" gst_type DEFAULT 'IGST',
ADD COLUMN IF NOT EXISTS "gstPercentage" NUMERIC(5,2) DEFAULT 18,
ADD COLUMN IF NOT EXISTS packaging TEXT;

-- Banking details (separate fields)
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccountNo" TEXT,
ADD COLUMN IF NOT EXISTS "bankIfscCode" TEXT,
ADD COLUMN IF NOT EXISTS "bankBranch" TEXT;

-- Company details (for PDF header)
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "companyName" TEXT,
ADD COLUMN IF NOT EXISTS "companyAddress" TEXT,
ADD COLUMN IF NOT EXISTS "companyGstin" TEXT,
ADD COLUMN IF NOT EXISTS "companyEmail" TEXT,
ADD COLUMN IF NOT EXISTS "companyPhone" TEXT,
ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;

-- Remove old bankingDetails column if you want (optional)
-- ALTER TABLE outbound_quotations DROP COLUMN IF EXISTS "bankingdetails";

-- Update existing records with default company details (optional)
UPDATE outbound_quotations 
SET 
  "companyName" = 'CHENNUPATI PLASTICS',
  "companyAddress" = '123, Industrial Area, Phase-II, Pune - 411 001, Maharashtra',
  "companyEmail" = 'info@chennupatiplastics.com',
  "companyPhone" = '+91-9876543210',
  "companyWebsite" = 'www.chennupatiplastics.com',
  "companyGstin" = '27AAAAA0000A1Z5',
  "gstType" = 'IGST',
  "gstPercentage" = 18
WHERE "companyName" IS NULL;

COMMENT ON TABLE customers IS 'Customer records with comprehensive contact and address information';
COMMENT ON TABLE outbound_quotations IS 'Outbound quotations with comprehensive quotation management fields';