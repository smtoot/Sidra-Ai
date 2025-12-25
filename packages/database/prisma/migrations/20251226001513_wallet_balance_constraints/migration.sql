-- SECURITY: Add database-level constraints to prevent negative balances
-- This provides defense-in-depth alongside application-level checks

-- Prevent negative balance (available funds)
ALTER TABLE "Wallet" ADD CONSTRAINT "wallet_balance_non_negative" CHECK ("balance" >= 0);

-- Prevent negative pending balance (locked funds)
ALTER TABLE "Wallet" ADD CONSTRAINT "wallet_pending_balance_non_negative" CHECK ("pendingBalance" >= 0);

-- RATIONALE:
-- 1. Application-level checks can be bypassed by bugs or race conditions
-- 2. Database constraints are the last line of defense
-- 3. Failed transactions will rollback, preventing data corruption
-- 4. Provides clear error messages for debugging
