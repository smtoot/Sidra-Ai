# Admin Dashboard Audit Report

**Date:** 2025-12-24
**Scope:** Admin Dashboard (Web Client & API)
**Auditor:** Antigravity (AI Agent)

---

## 1. Admin Page Inventory

| Route | Component Name | Status | Purpose | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `AdminDashboardPage` | ✅ Functional | High-level Overview | Shows stats (Users, Bookings, Volume) and Quick Actions. |
| `/admin/users` | `AdminUsersPage` | ✅ Functional | User Management | List, Search, Role view, Ban/Unban action. |
| `/admin/teachers` | `AdminTeachersPage` | ✅ Functional | Application Review | Lists pending teacher applications. Approve/Reject actions. |
| `/admin/bookings` | `AdminBookingsPage` | ✅ Functional | Booking Oversight | List all bookings with status filters. Actions: Cancel, Complete. |
| `/admin/disputes` | `AdminDisputesPage` | ✅ Functional | Dispute Resolution | Comprehensive dispute handling (Resolve, Refund, Split). |
| `/admin/packages` | `AdminPackagesPage` | ✅ Functional | Pricing Management| CRUD for Package Tiers (Session bundles). |
| `/admin/financials` | `AdminFinancialsPage` | ⚠️ Partial | Financial Review | Shows aggregate stats and **Pending** transactions only. |
| `/admin/wallet` | `AdminWalletPage` | ⚠️ Redundant | Deposit Approval | Duplicate of Financials page transaction list. Focuses on Receipt images. |
| `/admin/settings` | *Not Inspected* | ❓ Unconfirmed | System Config | Likely exists (linked from dashboard) but not deep-dived. |
| `/admin/audit-logs` | *Not Inspected* | ❓ Unconfirmed | Security Audit | Linked from dashboard. API exists. |

---

## 2. Current Financial Visibility

> **Can Admin answer: "Where did the money go?"** -> **NO.**

### Visibility Status
| Metric | Visibility | Data Source | Notes |
| :--- | :--- | :--- | :--- |
| **Wallet Balances** | ❌ **Hidden** | N/A | Admin cannot see User Wallet Balances (Ledger state). |
| **Pending Deposits** | ✅ Visible | `walletApi.getTransactions` | Admin sees pending deposits waiting for approval. |
| **Pending Payouts** | ✅ Visible | `walletApi.getTransactions` | Admin sees pending withdrawals waiting for processing. |
| **Transaction History** | ❌ **Hidden** | `walletApi.getTransactions` | API supports it, but UI **only fetches 'PENDING'**. Completed history is invisible. |
| **Platform Revenue** | ⚠️ Aggregate | `walletApi.getAdminStats` | Shows "Total Revenue" (Sum of deposits) not actual earnings/commission. |
| **Booking Financials** | ✅ Visible | `adminApi.getBookings` | Booking price is visible. Commission split is calculated on backend but not explicitly verified in UI details. |

### Critical Gaps
1.  **No Transaction Ledger**: Admin cannot look up a specific past transaction or user history.
2.  **No User Wallet View**: Admin cannot verify if a user has funds or debug balance issues.
3.  **Revenue Ambiguity**: "Total Revenue" stat seems to sum *Deposits* (`TransactionType.DEPOSIT`), which is **Liability**, not Revenue. True Revenue (Commission) is not tracked separately in the stats shown.

---

## 3. Current Admin Capabilities

### Financial Actions
| Action | Location | Backend Endpoint | Impact | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **Approve Deposit** | Financials/Wallet | `PATCH /wallet/admin/transactions/:id` | Increments User Balance. | 🟠 Medium |
| **Reject Deposit** | Financials/Wallet | `PATCH /wallet/admin/transactions/:id` | No financial change. | 🟢 Low |
| **Approve Withdrawal** | *Implied* | `PATCH /wallet/admin/transactions/:id` | **Logic exists** (approves request). | 🟠 Medium |
| **Pay Withdrawal** | *Hidden UI* | `PATCH /wallet/admin/transactions/:id` | Decrements Pending Balance. Requires Proof ID. | 🔴 High |
| **Resolve Dispute** | Disputes Page | `PATCH /admin/disputes/:id/resolve` | **Complex Mutation**: Refunds, Transfers, Splits. | 🔴 High |

*Note: Withdrawal "Pay" action (Mark as Paid) logic exists in backend (`status: PAID`), but UI button labels in `financials` page are generic "Approve" (`handleProcess(..., 'APPROVED')`). It is unclear if "Approved" transitions withdrawal to `PAID` or just `APPROVED` (intermediate state).*

### Operational Actions
| Action | Location | Impact | Risk |
| :--- | :--- | :--- | :--- |
| **Verify Teacher** | Teachers Page | Activates Teacher Profile. | 🟢 Low |
| **Ban User** | Users Page | Blocks login. | 🟠 Medium |
| **Cancel Booking** | Bookings Page | Refunds student (if logic holds), changes status. | 🟠 Medium |
| **Edit Packages** | Packages Page | Changes global pricing tiers. | 🟠 Medium |

---

## 4. Permissions & Safety

- **RBAC**: ✅ Enforced. Controllers use `@Roles(UserRole.ADMIN)` and `RolesGuard`.
- **Atomic Transactions**: ✅ Used heavily. `WalletService.processTransaction` and `AdminService.resolveDispute` use `prisma.$transaction` to ensure ledger integrity.
- **Idempotency**: ✅ Checks exist (e.g., preventing re-processing of finalized transactions).
- **Dangerous Exposure**:
    - **Approve Deposit**: No double-confirmation or threshold limits visible. One click approves any amount.
    - **Dispute Resolution**: "Student Wins" triggers instant full refund. High trust placed in Admin operator.

---

## 5. Conclusions & Opportunities

### Is the Admin "Blind"?
**Yes, partially.**
The Admin is blind to **Historical Data** and **User Balances**. They can manage the *queue* (pending items) effectively but cannot audit the *state* (past records, current holdings).

### Reuse Opportunities (✅)
- `AdminBookingsPage` is solid and can be enhanced with more filters.
- `AdminDisputesPage` is excellent and feature-complete.
- `WalletService` backend logic is robust and supports the missing UI features (history viewing).

### Critical Gaps (❌)
1.  **Transaction History UI**: Missing page to view all transactions (filter by user, type, date).
2.  **User Wallet Inspection**: Missing "Wallet" tab in User Details to see their balance and ledger.
3.  **Withdrawal Workflow**: The UI treats Deposits and Withdrawals identically ("Approve"). Withdrawals likely need a 2-step flow (Approve Request -> Mark Paid with Receipt). Current UI might be oversimplifying this.
4.  **Financial Stats Accuracy**: The "Revenue" stat misleadingly shows Total Deposits (Liability).

### Recommendations (Next Sprint)
1.  **Implement All Transactions View**: Leverage existing `getAdminTransactions` API by removing the 'PENDING' filter constraint in a new UI view.
2.  **Fix Withdrawal Flow**: Distinguish between "Approve Request" and "Confirm Payment Sent" in the UI.
3.  **User Wallet View**: Add `getWallet(userId)` endpoint for Admin and show it in User Profile.
