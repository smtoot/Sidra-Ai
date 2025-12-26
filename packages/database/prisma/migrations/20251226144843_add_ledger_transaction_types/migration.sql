-- P1-1: Add transaction types for complete ledger tracking
-- AlterEnum: Add new transaction types to track all wallet balance mutations
ALTER TYPE "TransactionType" ADD VALUE 'WITHDRAWAL_COMPLETED';
ALTER TYPE "TransactionType" ADD VALUE 'WITHDRAWAL_REFUNDED';
ALTER TYPE "TransactionType" ADD VALUE 'DEPOSIT_APPROVED';
