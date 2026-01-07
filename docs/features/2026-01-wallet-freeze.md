# Feature: Wallet Freeze & Security Control

## Owner
- Product Owner: Omar
- Implementer: Antigravity
- Reviewer: Claude

---

## Goal
To provide administrators with the ability to "freeze" a user's wallet. This prevents outgoing transactions (withdrawals, payments) while investigating suspicious activity or disputes, enhancing platform security and fraud prevention.

---

## Scope
### In Scope
- **Database Schema**: Add `isFrozen`, `frozenAt`, `frozenReason`, `frozenByAdminId` to the `wallets` table.
- **Backend API**:
    - `POST /admin/wallets/:userId/freeze`: Endpoint to freeze a wallet with a reason.
    - `POST /admin/wallets/:userId/unfreeze`: Endpoint to unfreeze.
- **Service Logic**:
    - Modify `WalletService` to check `isFrozen` status before processing any *debit* transaction (Payment, Withdrawal).
    - Allow *credit* transactions (Deposits, Refunds) to strictly allow funds *in* but not *out* (optional, but recommended).
- **Frontend Admin UI**:
    - Add "Freeze/Unfreeze" button in the Admin User Wallet view.
    - Display "FROZEN" badge on the user's wallet dashboard if frozen.

### Out of Scope
- Automated fraud detection triggers (Manual admin action only for now).
- Freezing entire user accounts (Login is still allowed, only wallet is affected).

---

## User Flow
1. **Admin** navigates to a User's details page in Admin Panel.
2. Admin opens the "Wallet" tab.
3. Admin clicks "Freeze Wallet".
4. System prompts for a "Reason" (text input).
5. Admin confirms.
6. **User** logs in and views their Wallet.
7. User sees a "Wallet Suspended" alert and cannot initiate Withdrawals or Pay for bookings.
8. Admin later resolves the issue and clicks "Unfreeze".
9. Wallet functionality is restored.

---

## Database Impact
- [ ] No DB change
- [x] Schema change
- [x] New migration required

Details:
- Add columns to `wallets` table:
    - `isFrozen` (Boolean, default false)
    - `frozenReason` (String, optional)
    - `frozenAt` (DateTime, optional)

---

## Acceptance Criteria (MANDATORY)
- [ ] Admin can successfully freeze a wallet with a reason.
- [ ] Admin can unfreeze a wallet.
- [ ] Frozen wallet CANNOT initiate a Withdrawal request.
- [ ] Frozen wallet CANNOT pay for a Booking (Payment Lock fails).
- [ ] Frozen wallet CAN receive a Deposit (Funds coming in).
- [ ] User sees a clear error/status message when attempting restricted actions.
- [ ] Database migration is created and valid.

---

## Environments Verification
- [ ] Local tested
- [ ] Staging tested
- [ ] Production ready

---

## PR Reference
- PR Link:

---

## Final Status
- [x] Draft
- [ ] In Progress
- [ ] Ready for Review
- [ ] Accepted
