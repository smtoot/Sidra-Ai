# Phase 1 Complete - Next Steps

## ✅ What I've Completed

### 1. Database Schema Updates
Updated `/packages/database/prisma/schema.prisma` with:

✅ **Enhanced PackageTier Model**:
- Added `recurringRatio`, `floatingRatio` (configurable 80/20 split)
- Added `rescheduleLimit`, `durationWeeks`, `gracePeriodDays`
- Added bilingual names (`nameAr`, `nameEn`)
- Added marketing fields (`isFeatured`, `badge`)

✅ **New TeacherPackageTierSetting Model**:
- Allows teachers to enable/disable specific tiers
- Per-tier opt-in/opt-out control

✅ **Updated TeacherDemoSettings Model**:
- Added `packagesEnabled` master toggle

✅ **Enhanced StudentPackage Model**:
- Added Smart Pack tracking fields (`recurringWeekday`, `recurringTime`)
- Added session distribution (`recurringSessionCount`, `floatingSessionCount`)
- Added expiry tracking (`firstScheduledSession`, `lastScheduledSession`, `gracePeriodEnds`)
- Added `tierId` reference to package tier

✅ **Updated Booking Model**:
- Added `maxReschedules`, `originalScheduledAt`
- Added `packageSessionType` enum (AUTO_SCHEDULED, FLOATING)

✅ **New Enum: PackageSessionType**:
- AUTO_SCHEDULED (recurring sessions)
- FLOATING (manually booked)

### 2. Seed Data File
Created `/packages/database/prisma/seed-package-tiers.ts` with your requested default tiers:
- 5 sessions: 5% discount (4 recurring + 1 floating, 4 weeks)
- 10 sessions: 8% discount (8 recurring + 2 floating, 6 weeks)
- **12 sessions: 10% discount** (10 recurring + 2 floating, 7 weeks) - **Featured/Recommended**
- 15 sessions: 15% discount (12 recurring + 3 floating, 9 weeks)

---

## 🚀 What You Need to Do Next

### Step 1: Create the Database Migration

Since Prisma migrate requires interactive mode, you need to run this command manually:

```bash
cd packages/database
npx prisma migrate dev --name add_smart_pack_configuration
```

This will:
1. Generate the SQL migration file
2. Apply it to your local database
3. Update the Prisma Client

**Expected changes**:
- Add columns to `package_tiers` table
- Add columns to `teacher_demo_settings` table
- Create `teacher_package_tier_settings` table
- Add columns to `student_packages` table
- Add columns to `bookings` table
- Create `PackageSessionType` enum

### Step 2: Run the Seed Script

After the migration completes successfully, seed the default package tiers:

```bash
cd packages/database
npx ts-node prisma/seed-package-tiers.ts
```

This will create the 4 default tiers in your database.

### Step 3: Verify the Migration

Check that everything was created correctly:

```bash
cd packages/database
npx prisma studio
```

In Prisma Studio, verify:
- `package_tiers` table has the new columns and 4 rows
- `teacher_package_tier_settings` table exists
- `student_packages` table has the new columns
- `bookings` table has the new columns

### Step 4: Regenerate Prisma Client

Ensure the TypeScript types are up-to-date:

```bash
cd packages/database
npx prisma generate
```

### Step 5: Build the Shared Package

The shared package needs to export the new types:

```bash
cd packages/shared
npm run build
```

---

## 📋 What's Next (Phase 2)

Once you've completed the above steps, I'll proceed with:

1. **Create DTOs** for package management (shared package)
2. **Update Backend Services** for Smart Pack logic
3. **Create Admin API** endpoints for tier management
4. **Create Teacher API** endpoints for tier settings
5. **Update Package Service** to handle dynamic tiers

Let me know once you've run the migration and seed script, and I'll continue with Phase 2!

---

## 🔍 Troubleshooting

### If Migration Fails

1. **Check Database Connection**:
   ```bash
   cd packages/database
   npx prisma db pull
   ```

2. **Review Existing Data**:
   If you have existing `package_tiers` data, the migration might fail due to the new `NOT NULL` column `durationWeeks`.

   **Solution**: Either:
   - Drop existing package_tiers: `DELETE FROM package_tiers;`
   - Or modify the migration to handle existing data

3. **Manual Migration** (if needed):
   The migration SQL will be in:
   `/packages/database/prisma/migrations/[timestamp]_add_smart_pack_configuration/migration.sql`

   You can manually review and adjust it before applying.

### If Seed Fails

Check for:
- **Duplicate IDs**: The seed uses fixed IDs like `tier-5-sessions`. If running multiple times, use `npx prisma db push --force-reset` first (⚠️ deletes all data)
- **Database Connection**: Verify `.env` DATABASE_URL is correct

---

## Summary

**Phase 1 Status**: ✅ Complete (schema updated, seed file ready)

**Your Action Required**:
1. Run `npx prisma migrate dev --name add_smart_pack_configuration`
2. Run `npx ts-node prisma/seed-package-tiers.ts`
3. Run `npx prisma generate`
4. Run `cd ../shared && npm run build`
5. Let me know when done → I'll continue with Phase 2

---

Great work so far! The foundation is solid. Once the migration is applied, we'll have a fully configurable Smart Pack system ready for the backend logic implementation.
