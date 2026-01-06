# Profile Hub Mobile Improvements - Complete Plan

## Summary

All profile hub sections analyzed. **10 files** need updates for mobile.

---

## Issues by Section

| Section | File | Issues |
|---------|------|--------|
| Page wrapper | `page.tsx` | `p-8` → `p-4 md:p-8` |
| Card container | `ProfileSection.tsx` | `px-6 py-4` → `px-4 md:px-6 py-3 md:py-4` |
| ProfileBasicsSection | ✅ Already good | Uses `grid-cols-1 md:grid-cols-2` |
| PersonalInfoSection | Select has inline styles | Missing `h-12 text-base` |
| QualificationsSection | Uses `GenderSelector` | Need to check shared component |
| SkillsExperienceSection | Wrapper only | Child managers need fixes |
| SkillsManager | Select uses `h-11` | → `h-12 text-base` |
| TeachingApproachSection | Tag buttons `py-3` | Add `min-h-[48px]` |
| SubjectsManager | Selects `h-10`, grade buttons small | → `h-12`, grades `min-h-[40px]` |
| TeachingPoliciesSection | Wrapper | Check child |

---

## All Changes

### Phase 1: Core Layout

**`apps/web/src/app/teacher/profile-hub/page.tsx`**
```diff
-className="min-h-screen bg-background font-tajawal rtl p-8"
+className="min-h-screen bg-background font-tajawal rtl p-4 md:p-8"

-<header className="mb-8 flex items-start justify-between">
+<header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
```

**`ProfileSection.tsx`**
```diff
-<div className="bg-gray-50 px-6 py-4 border-b...">
+<div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-b...">

-<div className="p-6">
+<div className="p-4 md:p-6">
```

---

### Phase 2: PersonalInfoSection

**Line 310 - Country select:**
```diff
-className="w-full text-right px-3 py-2 rounded-md..."
+className="w-full h-12 text-right px-3 py-2.5 text-base rounded-md..."
```

**Line 230 - Section headers:**
```diff
-<div className="pb-2 border-b border-gray-100 mt-8">
+<div className="pb-2 border-b border-gray-100 mt-6 md:mt-8">
```

---

### Phase 3: SubjectsManager (largest file)

**Lines 180-204 - Selects:**
```diff
-className="w-full h-10 rounded-md..."
+className="w-full h-12 rounded-md... text-base"
```

**Lines 251-263 - Grade checkboxes:**
```diff
-className="cursor-pointer text-xs border rounded px-2 py-1.5..."
+className="cursor-pointer text-sm border rounded px-3 py-2 min-h-[40px]..."
```

---

### Phase 4: TeachingApproachSection

**Lines 115-129 - Tag buttons:**
```diff
-className="relative flex items-center justify-between px-4 py-3 rounded-xl..."
+className="relative flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl..."
```

---

### Phase 5: SkillsManager (shared)

**Lines 343, 366 - Form selects:**
```diff
-className="w-full h-11 px-3 rounded-lg..."
+className="w-full h-12 px-3 text-base rounded-lg..."
```

---

### Phase 6: GenderSelector (shared)

Need to check file location and update button sizes.

---

## Files Summary

| # | File | Priority |
|---|------|----------|
| 1 | `page.tsx` | High |
| 2 | `ProfileSection.tsx` | High |
| 3 | `PersonalInfoSection.tsx` | High |
| 4 | `SubjectsManager.tsx` | Medium |
| 5 | `TeachingApproachSection.tsx` | Medium |
| 6 | `SkillsManager.tsx` | Medium |
| 7 | `GenderSelector.tsx` | Low |
| 8 | `WorkExperienceManager.tsx` | Low |
| 9 | `QualificationsManager.tsx` | Low |

**Estimated: ~2-3 hours total**

---

## Verification

After implementation, test each section on mobile:
- [ ] All selects open correctly (no iOS zoom)
- [ ] All buttons are easily tappable (48px min)
- [ ] Cards have proper breathing room
- [ ] Forms don't feel cramped
