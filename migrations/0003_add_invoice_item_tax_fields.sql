-- Migration: Add tax and amount fields to invoice_items
-- Date: 2025-10-10

ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS "hsnSac" text,
ADD COLUMN IF NOT EXISTS "cgstRate" numeric(5, 2),
ADD COLUMN IF NOT EXISTS "sgstRate" numeric(5, 2),
ADD COLUMN IF NOT EXISTS "igstRate" numeric(5, 2),
ADD COLUMN IF NOT EXISTS "amount" numeric(12, 2);