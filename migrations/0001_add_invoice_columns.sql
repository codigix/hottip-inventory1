-- Add missing columns to invoices table
ALTER TABLE "invoices" ADD COLUMN "cgstAmount" numeric(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "sgstAmount" numeric(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "igstAmount" numeric(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "discountAmount" numeric(10,2) DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "balanceAmount" numeric(10,2);