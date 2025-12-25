# Demo Anti-Abuse - Closure Report

## Summary

Hardened demo system against abuse via child creation, subject switching, and teacher reuse.

---

## Policy → Code → Tests Mapping

| Policy Rule | Code Location | Test Coverage |
|-------------|---------------|---------------|
| Monthly quota (3/owner) | `canBookDemo` quota check | ✅ Monthly Quota (2 tests) |
| ONE demo per owner-teacher (lifetime) | `@@unique([demoOwnerId, teacherId])` | ✅ Teacher Uniqueness (2 tests) |
| Cancel = CANCELLED (not delete) | `cancelDemoRecord` | ✅ Cancellation Counts |
| Cancelled counts toward quota | `status IN ('COMPLETED','CANCELLED')` | ✅ Child Abuse Prevention |
| Max 1 reschedule | `rescheduleDemoSession` | ✅ Reschedule Limits (2 tests) |
| New child doesn't reset | Uses `demoOwnerId` not childId | ✅ Child Addition Abuse |
| No money movement | No wallet in DemoService | ✅ No Money Movement |

---

## Files Changed

| File | Change |
|------|--------|
| `schema.prisma` | DemoSession: `demoOwnerId`, `demoOwnerType`, `status`, `beneficiaryId`, `rescheduleCount`, `cancelledAt`, `DemoStatus` enum |
| `demo-policy.constants.ts` | **NEW** - `maxDemosPerOwnerPerMonth: 3`, `demoMaxReschedules: 1` |
| `demo.service.ts` | **REWRITTEN** - Anti-abuse hardened |
| `demo-anti-abuse.integration.spec.ts` | **NEW** - 11 tests |

---

## Test Results

```
PASS test/demo-anti-abuse.integration.spec.ts (11/11)
✓ Monthly quota enforced
✓ Under limit → allowed
✓ Cancel marks CANCELLED
✓ First reschedule → allowed
✓ Second reschedule → forbidden
✓ Same teacher (completed) → rejected
✓ Same teacher (cancelled) → rejected
✓ Different teacher → allowed
✓ Child addition doesn't reset quota
✓ Cancel after reschedule → works
✓ No wallet interaction
```

---

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Child abuse impossible | ✅ |
| Subject switching abuse impossible | ✅ |
| ONE demo per owner-teacher (lifetime) | ✅ |
| Monthly quota enforced | ✅ |
| Cancellation counts as usage | ✅ |
| Reschedule limited to once | ✅ |
| Admin can adjust limits | ✅ (constants) |
| All tests pass | ✅ (11/11) |
