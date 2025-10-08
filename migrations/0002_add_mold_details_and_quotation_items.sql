-- Migration: Add moldDetails and quotationItems JSONB columns to outbound_quotations
-- Date: 2025-01-XX
-- Description: Adds support for dynamic mold details and quotation items in outbound quotations

-- Add moldDetails JSONB column
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "moldDetails" JSONB DEFAULT '[]'::jsonb;

-- Add quotationItems JSONB column
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "quotationItems" JSONB DEFAULT '[]'::jsonb;

-- Add projectIncharge field if not exists
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "projectIncharge" TEXT;

-- Add termsConditions field if not exists
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "termsConditions" TEXT;

-- Add packaging field if not exists (if not already added in previous migration)
ALTER TABLE outbound_quotations
ADD COLUMN IF NOT EXISTS "packaging" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN outbound_quotations."moldDetails" IS 'JSONB array containing mold/part details with fields: no, partName, mouldNo, plasticMaterial, colourChange, mfi, wallThickness, noOfCavity, gfPercent, mfPercent, partWeight, systemSuggested, noOfDrops, trialDate, quotationFor';

COMMENT ON COLUMN outbound_quotations."quotationItems" IS 'JSONB array containing quotation line items with fields: no, partName, partDescription, uom, qty, unitPrice, amount';

-- Example data structure for reference:
-- moldDetails: [
--   {
--     "no": 1,
--     "partName": "Housing Cover",
--     "mouldNo": "M-2024-001",
--     "plasticMaterial": "PP",
--     "colourChange": "Yes",
--     "mfi": "12",
--     "wallThickness": "2.5mm",
--     "noOfCavity": 4,
--     "gfPercent": "20",
--     "mfPercent": "5",
--     "partWeight": 150.5,
--     "systemSuggested": "Injection Molding",
--     "noOfDrops": 2,
--     "trialDate": "2024-01-15",
--     "quotationFor": "Production"
--   }
-- ]
--
-- quotationItems: [
--   {
--     "no": 1,
--     "partName": "Housing Cover",
--     "partDescription": "Plastic housing cover with reinforcement",
--     "uom": "NOS",
--     "qty": 1000,
--     "unitPrice": 25.50,
--     "amount": 25500.00
--   }
-- ]