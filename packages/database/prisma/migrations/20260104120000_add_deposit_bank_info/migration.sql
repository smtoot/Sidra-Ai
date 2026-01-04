-- SECURITY FIX: Add deposit bank info fields to system_settings
-- This moves hardcoded bank details from frontend to database

ALTER TABLE "system_settings" ADD COLUMN "depositBankName" TEXT NOT NULL DEFAULT 'بنك الخرطوم';
ALTER TABLE "system_settings" ADD COLUMN "depositAccountHolderName" TEXT NOT NULL DEFAULT 'عمر محمد عبدالرحيم عبيشي';
ALTER TABLE "system_settings" ADD COLUMN "depositAccountNumber" TEXT NOT NULL DEFAULT '1401733';
