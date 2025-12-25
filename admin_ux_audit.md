# Admin Dashboard Audit & Redesign Proposal (Phase 0)

## 1. Current State Audit

### A. Navigation & Information Architecture
The current navigation is flat, consisting of 12 top-level items without grouping. This creates cognitive load and operational inefficiency.

| Menu Item (Label) | Route | Purpose | Action Type | Issues |
| :--- | :--- | :--- | :--- | :--- |
| **لوحة المهام المالية** | `/admin/financials` | Approve Deposits/Withdrawals | **Task Board** | Misnamed "Financials" (implies overview). actually a workflow tool. |
| **أرشيف طلبات السحب** | `/admin/payouts` | History of paid withdrawals | **Archive** | Redundant if Ledger exists? Separate from Financials task board. |
| **سجل المعاملات** | `/admin/transactions` | All wallet movements | **Ledger** | Good but sits at same level as Payouts/Financials. |
| **الحجوزات** | `/admin/bookings` | View all bookings | **Ledger/Dashboard** | overarching list. |
| **باقات الحصص** | `/admin/packages` | Manage discount tiers | **Configuration** | Mixed with operational items. |
| **الحصص التجريبية** | `/admin/demo` | Monitor free sessions | **Dashboard** | Niche workflow, takes top-level slot. |
| **الشكاوى** | `/admin/disputes` | Resolve conflict | **Task Board** | Critical workflow, misplaced alphabetically. |
| **طلبات المعلمين** | `/admin/teacher-applications` | Vet new teachers | **Task Board** | workflow vs "Users" entity. |
| **المستخدمين** | `/admin/users` | Manage accounts | **Directory** | Generic. |
| **إدارة المحتوى** | `/admin/content` | Subjects/Curricula | **Configuration** | Vague name. "Marketplace" might be better. |
| **سجل العمليات** | `/admin/audit-logs` | System activity | **Log** | Technical tool. |
| **إعدادات النظام** | `/admin/settings` | Fees/Rules | **Configuration** | Standard. |

**Critical IA Issues:**
*   **No Grouping**: 12 items is too many for a flat list.
*   **Naming Confusion**: "Financials" vs "Transactions" vs "Payouts".
*   **Workflow Fragmentation**: "Teacher Applications" (Onboarding) is far from "Teachers" (Management).

### B. Default Entry Point
*   **Current Land**: `/admin` (Stat Dashboard).
*   **Assessment**: Correct entry point, but content is weak.
*   **Missing**: Urgent Action Count (e.g., "5 Pending Withdrawals", "3 Disputes").

### C. Stats & Metrics Audit

| Stat | Source | Assessment | Recommendation |
| :--- | :--- | :--- | :--- |
| **Total Users** | `counts.users` | Informational (Vanity) | Keep on Dashboard. |
| **Bookings** | `counts.bookings` | Informational | Keep. |
| **Volume (Total Deposits)** | `financials.totalVolume` | **Misleading** | This is Liability (User Money), NOT Revenue. Rename "Total User Funding". |
| **Growth (+12%)** | Hardcoded | **FAKE** | **REMOVE**. Only show real data. |
| **Total Revenue** | `walletApi.getAdminStats` | Critical | **MISSING** from Dashboard. Only on Financials page. |
| **Pending Payouts** | `walletApi.getAdminStats` | Actionable | Move to Dashboard as "Urgent Alert". |

---

## 2. Global Benchmarking

Comparing Sidra with **Stripe Express** & **Udemy Admin**:

*   **Structure**:
    *   *Stripe*: Uses "Home", "Payments", "Balances", "Customers".
    *   *Sidra*: Mixes "Financials" (Tasks) and "Transactions" (Data).
*   **Workflows**:
    *   *Best Practice*: Dashboard shows "Need Attention" items first (Pending Applications, Disputes).
    *   *Sidra*: Dashboard shows generic stats. Workflow pages are buried.
*   **Hierarchy**:
    *   *Best Practice*: Entities (Users, Bookings) vs Configuration (Settings, Packages).
    *   *Sidra*: Flat list treats "Settings" equal to "Disputes".

---

## 3. Proposed New Admin Architecture

**Design Philosophy**: Role-Based & Workflow-Centric.

### 1. **Dashboard** (`/admin`)
   *   **Overview**: High-level metrics (Real Revenue, Active Users).
   *   **Action Center**: Widget showing counts of *Pending Teachers*, *Open Disputes*, *Pending Withdrawals*.

### 2. **Operations** (Daily Workflows)
   *   **Booking Management** (`/admin/bookings`)
   *   **Disputes** (`/admin/disputes`)
   *   **Teacher Applications** (`/admin/onboarding`) -> *Renamed from teacher-applications*
   *   **Demo Request Monitor** (`/admin/demo`)

### 3. **Financials**  (Money Management)
   *   **Task Board** (`/admin/financials/tasks`) -> *Formerly /admin/financials*
   *   **Payouts Archive** (`/admin/financials/payouts`)
   *   **Transaction Ledger** (`/admin/financials/ledger`)
   *   **Financial Health** (`/admin/financials/reports`) -> *New: Revenue vs Liability graphs*

### 4. **User Directory**
   *   **All Users** (`/admin/users`) -> *With tabs: Staff, Teachers, Parents, Students*
   *   **User Profiles** (`/admin/users/[id]`)

### 5. **Marketplace & Content**
   *   **Packages** (`/admin/packages`)
   *   **Curricula & Subjects** (`/admin/content`)

### 6. **System**
   *   **Audit Logs** (`/admin/system/logs`)
   *   **Settings** (`/admin/system/settings`)

---

## 4. UX Principles for Redesign

1.  **Safety First**:
    *   Financial actions (Approve/Reject) always require confirmation.
    *   Dangerous actions hidden for "Support" role.

2.  **Task vs Archive**:
    *   Screens are either for *doing work* (Task Board) or *finding records* (Ledger). Never mix them.

3.  **Real-Time Urgency**:
    *   Badges on Sidebar for pending items (e.g., "Disputes (3)").

4.  **Dense Data**:
    *   Admin screens should use table views with high information density, not "card" views (except Dashboard).

---

## 5. Next Phases Breakdown

### Phase 1: Navigation & Layout
*   Implement collapsible **Grouped Sidebar**.
*   Refactor routing structure to match new hierarchy (directories).
*   Add sidebar notification badges (counters).

### Phase 2: Dashboard UX
*   Replace standard stats with "**Action Center**".
*   Remove hardcoded/vanity metrics.
*   Add "Financial Health" summary (Revenue vs Liability).

### Phase 3: Page-by-Page Polish
*   Standardize all Tables (Filters, Pagination, Actions).
*   Standardize "Details" pages (User Details, Booking Details).
