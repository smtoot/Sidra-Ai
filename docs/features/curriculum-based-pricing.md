# Feature: Differential Pricing by Curriculum

> [!WARNING]
> **Status**: Deferred / Delayed
> **Priority**: Medium
> **Date**: 2026-01-10

## Overview
Currently, the system allows establishing a price for a "Teacher Subject" combination. However, the `teacher_subjects` table actually links `Teacher`, `Subject`, AND `Curriculum`. This means the database technically supports different prices for "Math (British)" vs "Math (Sudanese)" for the same teacher.

The problem is that the **booking** and **package purchase** logic currently ignores the `curriculumId` when looking up the price. It simply picks the *first* subject entry it finds for that teacher. This creates ambiguity and prevents teachers from correctly pricing their services based on the curriculum's difficulty or market rate.

## Goal
Enable teachers to set different prices for the same subject under different curricula, and ensure the correct price is applied when a student books a session or buys a package.

## Technical Analysis

### Current Database State
The `teacher_subjects` table schema is already correct:
```prisma
model teacher_subjects {
  id           String @id @default(uuid())
  teacherId    String
  subjectId    String
  curriculumId String  // <--- Discriminator exists
  pricePerHour Decimal
  // ... relationships
}
```

### The Gap
1.  **API Requests**: `CreateBookingDto` and `PurchaseSmartPackDto` do not require (or even include) `curriculumId`.
2.  **Service Logic**: `BookingService.createRequest` and `PackageService.purchasePackage` use `findFirst({ teacherId, subjectId })` to find the price. This effectively ignores the curriculum discriminator.

## Implementation Plan (Deferred)

### 1. Update DTOs
Modify `packages/shared/src/booking/booking.dto.ts` and `purchase-smart-pack.dto.ts` to include `curriculumId`.

```typescript
// CreateBookingDto
@IsUUID()
@IsString()
@IsOptional() // Should eventually be required
curriculumId?: string;
```

### 2. Update Backend Logic
**`BookingService.createRequest`**:
- Accept `curriculumId`.
- If provided, include it in the `teacher_subjects` query: `where: { teacherId, subjectId, curriculumId }`.
- If NOT provided (legacy support), maintain current behavior (fetch first) but log a warning.

**`PackageService`**:
- Similar update for `purchasePackage` and `purchaseSmartPackage`.

### 3. Update Frontend
- `BookingModal`: Pass the selected `curriculumId` to the API.
- `PackageModal`: Pass the selected `curriculumId` to the API.

## Notes for Future Implementation
- **Breaking Change Risk**: If we make `curriculumId` mandatory, older app clients will break. We should support it as optional initially or ensure all clients are updated.
- **Data Integrity**: We should verify that we don't have existing teachers with "duplicate" subject entries that were created in error due to this logic gap, effectively hiding one price behind another.
