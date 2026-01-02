# Skills & Work Experience Implementation Plan (v2)

> **Version:** 2.0
> **Last Updated:** January 2026
> **Status:** Ready for Implementation

## Overview

This document outlines the implementation plan for adding **Skills** and **Work Experience** sections to the teacher profile system. These sections will be **optional** (not affecting profile completion) and follow the same patterns as the existing `QualificationsManager` component.

---

## 1. Database Schema

### New Models in `prisma/schema.prisma`

```prisma
// Teacher's professional skills (e.g., "Classroom Management", "Online Teaching Tools")
model TeacherSkill {
  id             String           @id @default(uuid())
  teacherId      String
  teacherProfile TeacherProfile   @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  // Skill data
  name           String           // Stored as-is, normalized for comparison only
  category       SkillCategory?   // Optional categorization
  proficiency    SkillProficiency @default(INTERMEDIATE)

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([teacherId])
  @@map("teacher_skills")
}

enum SkillCategory {
  TEACHING_METHOD    // طرق التدريس
  TECHNOLOGY         // التقنيات
  SOFT_SKILL         // المهارات الشخصية
  SUBJECT_SPECIFIC   // تخصصية
}

enum SkillProficiency {
  BEGINNER      // مبتدئ
  INTERMEDIATE  // متوسط
  ADVANCED      // متقدم
  EXPERT        // خبير
}

// Teacher's work/teaching experience history
model TeacherWorkExperience {
  id             String         @id @default(uuid())
  teacherId      String
  teacherProfile TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  // Experience data
  title          String         // e.g., "معلم رياضيات"
  organization   String         // e.g., "مدرسة الخرطوم الثانوية"
  experienceType ExperienceType // SCHOOL, TUTORING_CENTER, ONLINE_PLATFORM, PRIVATE, OTHER

  // Duration
  startDate      DateTime?
  endDate        DateTime?      // Must be NULL if isCurrent=true
  isCurrent      Boolean        @default(false)

  // Details
  description    String?        @db.Text
  subjects       String[]       @default([])  // Optional, defaults to empty array

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([teacherId])
  @@index([teacherId, isCurrent, startDate])  // Compound index for sorting
  @@map("teacher_work_experiences")
}

enum ExperienceType {
  SCHOOL            // مدرسة
  TUTORING_CENTER   // مركز تعليمي
  ONLINE_PLATFORM   // منصة إلكترونية
  PRIVATE           // دروس خصوصية
  OTHER             // أخرى
}
```

### Update TeacherProfile Relations

```prisma
model TeacherProfile {
  // ... existing fields ...

  // Add new relations
  skills          TeacherSkill[]
  workExperiences TeacherWorkExperience[]
}
```

---

## 2. API Endpoints Design

### Skills Endpoints

| Method | Endpoint | Description | Sort Order |
|--------|----------|-------------|------------|
| GET | `/teacher/skills` | Get all skills for authenticated teacher | createdAt DESC |
| POST | `/teacher/skills` | Add a new skill | - |
| PATCH | `/teacher/skills/:id` | Update a skill | - |
| DELETE | `/teacher/skills/:id` | Remove a skill | - |

### Work Experience Endpoints

| Method | Endpoint | Description | Sort Order |
|--------|----------|-------------|------------|
| GET | `/teacher/work-experiences` | Get all work experiences for authenticated teacher | isCurrent DESC, startDate DESC, createdAt DESC |
| POST | `/teacher/work-experiences` | Add a new work experience | - |
| PATCH | `/teacher/work-experiences/:id` | Update a work experience | - |
| DELETE | `/teacher/work-experiences/:id` | Remove a work experience | - |

---

## 3. DTOs (`packages/shared/src/teacher/`)

### Skills DTOs

```typescript
// skill.dto.ts
export enum SkillCategory {
  TEACHING_METHOD = 'TEACHING_METHOD',
  TECHNOLOGY = 'TECHNOLOGY',
  SOFT_SKILL = 'SOFT_SKILL',
  SUBJECT_SPECIFIC = 'SUBJECT_SPECIFIC',
}

export enum SkillProficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

// CreateSkillDto - for POST
export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;  // Defaults to INTERMEDIATE
}

// UpdateSkillDto - for PATCH (all fields optional)
export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;
}
```

### Work Experience DTOs

```typescript
// work-experience.dto.ts
export enum ExperienceType {
  SCHOOL = 'SCHOOL',
  TUTORING_CENTER = 'TUTORING_CENTER',
  ONLINE_PLATFORM = 'ONLINE_PLATFORM',
  PRIVATE = 'PRIVATE',
  OTHER = 'OTHER',
}

// CreateWorkExperienceDto - for POST
export class CreateWorkExperienceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organization: string;

  @IsEnum(ExperienceType)
  experienceType: ExperienceType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;  // Defaults to false

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  subjects?: string[];  // Max 10 items, each max 50 chars
}

// UpdateWorkExperienceDto - for PATCH (all fields optional)
export class UpdateWorkExperienceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organization?: string;

  @IsOptional()
  @IsEnum(ExperienceType)
  experienceType?: ExperienceType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  subjects?: string[];
}
```

---

## 4. Backend Validation Rules

### Skills Validation

1. **Normalization:** Before comparison, normalize name: `name.trim().toLowerCase().replace(/\s+/g, ' ')`
2. **Uniqueness:** Check for duplicate skills per teacher (case-insensitive, service-level validation)
3. **Error message:** "هذه المهارة مضافة بالفعل"
4. **Max limit:** 15 skills per teacher → "الحد الأقصى 15 مهارة"
5. **Store original:** Save the original name (preserving case/formatting user entered)

### Work Experience Validation

#### Date Validation Matrix

| Scenario | Allowed? | Error Message (Arabic) |
|----------|----------|------------------------|
| No dates at all (startDate=null, endDate=null) | ✓ Yes | - |
| startDate only (endDate=null, isCurrent=false) | ✓ Yes | - |
| endDate only (startDate=null) | ✗ No | تاريخ البداية مطلوب عند تحديد تاريخ النهاية |
| Both dates, startDate > endDate | ✗ No | تاريخ البداية يجب أن يكون قبل تاريخ النهاية |
| endDate in future, isCurrent=false | ✗ No | تاريخ النهاية لا يمكن أن يكون في المستقبل |
| startDate in future | ✗ No | تاريخ البداية لا يمكن أن يكون في المستقبل |
| isCurrent=true with endDate provided | Auto-fix | Set endDate=null (no error) |
| endDate provided with isCurrent=true | Auto-fix | Set isCurrent=false (no error) |

#### Validation Order (Backend Service)

1. If `endDate` exists but `startDate` doesn't → Reject
2. If `startDate` > today → Reject
3. If `endDate` > today AND `isCurrent=false` → Reject
4. If `startDate` AND `endDate` AND `startDate > endDate` → Reject
5. If `isCurrent=true` → Auto-set `endDate=null`
6. If `endDate` provided → Auto-set `isCurrent=false`

#### Other Limits

- **Max experiences:** 20 per teacher
- **Subjects array:** Max 10 items, each trimmed, max 50 characters
- **Multiple current positions:** ALLOWED (teachers can have concurrent positions)

---

## 5. Sorting Rules (Backend Responsibility)

All sorting is handled by the backend. Frontend renders items in received order.

| Endpoint/Context | Sort Order |
|------------------|------------|
| `GET /teacher/skills` | createdAt DESC |
| `GET /teacher/work-experiences` | isCurrent DESC, startDate DESC, createdAt DESC |
| Marketplace public profile (skills) | proficiency DESC, name ASC |
| Marketplace public profile (experiences) | isCurrent DESC, startDate DESC, createdAt DESC |

---

## 6. Public Profile Security

### Visibility Guarantees

**CRITICAL:** Skills and Work Experience are ONLY exposed through the marketplace public profile query, which already enforces `applicationStatus = APPROVED`.

1. `GET /marketplace/teachers/:slug` → Only returns teacher if `applicationStatus = APPROVED`
2. `GET /marketplace/teachers` (search) → Only returns teachers with `applicationStatus = APPROVED`
3. Skills and workExperiences are included via Prisma `include` → They inherit the parent filter
4. There is NO direct public endpoint like `/public/teacher/:id/skills`
5. Authenticated `/teacher/skills` and `/teacher/work-experiences` → Only return authenticated teacher's own data

### Implementation Note

When adding skills/workExperiences to the marketplace query:

```typescript
// In marketplace.service.ts
include: {
  skills: { orderBy: [{ proficiency: 'desc' }, { name: 'asc' }] },
  workExperiences: { orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }, { createdAt: 'desc' }] },
  // ... other existing includes
}
// Parent where clause: { applicationStatus: 'APPROVED' } ensures security
```

---

## 7. Frontend Components

### Profile Hub Structure

**New Section in Profile Hub Navigation:**

| Section ID | Arabic Label | Icon |
|------------|--------------|------|
| `skills-experience` | المهارات والخبرات | `Briefcase` |

**Location:** After "المؤهلات والخبرات" (Qualifications) section

### New Components

#### 1. `SkillsExperienceSection.tsx` (Profile Hub Section Wrapper)

```
apps/web/src/components/teacher/profile-hub/sections/SkillsExperienceSection.tsx
```

Wraps both SkillsManager and WorkExperienceManager with section header.

#### 2. `SkillsManager.tsx` (Shared Component)

```
apps/web/src/components/teacher/shared/SkillsManager.tsx
```

Pattern: Follow `QualificationsManager.tsx` exactly
- List existing skills with edit/delete buttons
- Add new skill form (inline, not modal)
- Empty state for no skills
- Loading state
- Duplicate detection on name blur

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ ⭐ المهارات                      [3 مهارات] │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ استخدام التقنيات التعليمية الحديثة     │ │
│ │ التقنيات • متقدم            [✏️] [🗑️] │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ إدارة الفصل الدراسي                    │ │
│ │ المهارات الشخصية • خبير      [✏️] [🗑️] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ إضافة مهارة جديدة]                       │
└─────────────────────────────────────────────┘
```

**Empty State:**
"لم تضف أي مهارات بعد. المهارات تساعد أولياء الأمور على فهم قدراتك."

#### 3. `WorkExperienceManager.tsx` (Shared Component)

```
apps/web/src/components/teacher/shared/WorkExperienceManager.tsx
```

Pattern: Follow `QualificationsManager.tsx` exactly

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 💼 الخبرات العملية                       [2 خبرة] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ معلم رياضيات                                   │ │
│ │ 🏫 مدرسة الخرطوم الثانوية                      │ │
│ │ مدرسة • 2018 - الآن (حاليًا)        [✏️] [🗑️] │ │
│ │ المواد: رياضيات، إحصاء                        │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ مدرس خصوصي                                     │ │
│ │ 🏠 دروس خصوصية                                 │ │
│ │ دروس خصوصية • 2015 - 2018           [✏️] [🗑️] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [+ إضافة خبرة جديدة]                               │
└─────────────────────────────────────────────────────┘
```

**Empty State:**
"لم تضف أي خبرات عملية بعد. شارك تاريخك المهني لبناء الثقة."

### Work Experience Form UX

1. **"Currently working here" checkbox** at top of form
2. When checked:
   - Disable end date input
   - Clear end date value
   - Show "(حاليًا)" badge in preview
3. When end date is entered:
   - Automatically uncheck "currently working"
4. **Real-time validation:**
   - Show error if endDate entered without startDate
   - Show error if startDate in future
   - Show error if endDate in future (when not current)

---

## 8. Public Profile Display

### Location in TeacherProfileView.tsx

Add after the "Bio" section, before "Subjects" section.

### Display Rules

#### Skills Section
- **If empty + preview mode:** Show dashed placeholder: "لم تضف مهاراتك بعد"
- **If empty + public mode:** Hide section entirely
- **Display:** Horizontal chips/tags with proficiency indicator
- **Truncation:** Show first 6, then "+X المزيد" button
- **Expand behavior:** Inline expand (no modal)

#### Work Experience Section
- **If empty + preview mode:** Show dashed placeholder: "لم تضف خبراتك العملية بعد"
- **If empty + public mode:** Hide section entirely
- **Display:** Vertical list, compact cards
- **Current positions:** Show "(حاليًا)" green badge
- **Date format:** "2018 - الآن" or "2015 - 2018"
- **Truncation:** Show first 2, then "عرض X المزيد" button
- **Expand behavior:** Inline expand (no modal)
- **Multiple current positions:** All display with "(حاليًا)" badge, grouped at top by sort order

### Display Scenarios

#### Scenario A: No Data (Empty)
- **In Preview Mode:** Show dashed placeholder
- **In Public Mode:** Hide section entirely

#### Scenario B: Minimal Data (1-2 items each)
```
┌────────────────────────────────────────────┐
│ المهارات                                   │
│ ┌────────────┐ ┌───────────────┐          │
│ │ متقدم 🔵  │ │ إدارة الفصل  │           │
│ └────────────┘ └───────────────┘          │
│                                            │
│ الخبرات العملية                            │
│ ┌────────────────────────────────────────┐│
│ │ معلم رياضيات • مدرسة الخرطوم (حاليًا)  ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

#### Scenario C: Lots of Data (5+ items)
```
┌────────────────────────────────────────────┐
│ المهارات                                   │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │ مهارة1 │ │ مهارة2 │ │ مهارة3 │          │
│ └────────┘ └────────┘ └────────┘          │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │ مهارة4 │ │ مهارة5 │ │ مهارة6 │          │
│ └────────┘ └────────┘ └────────┘          │
│            [+4 المزيد]                     │
│                                            │
│ الخبرات العملية                            │
│ ┌────────────────────────────────────────┐│
│ │ معلم رياضيات • مدرسة الخرطوم (حاليًا)  ││
│ └────────────────────────────────────────┘│
│ ┌────────────────────────────────────────┐│
│ │ مدرب أونلاين • منصة نون (حاليًا)       ││
│ └────────────────────────────────────────┘│
│          [عرض 3 المزيد]                   │
└────────────────────────────────────────────┘
```

---

## 9. API Integration (Frontend)

### `apps/web/src/lib/api/teacher.ts`

```typescript
// Types
export interface TeacherSkill {
  id: string;
  name: string;
  category?: SkillCategory;
  proficiency: SkillProficiency;
  createdAt: string;
}

export interface TeacherWorkExperience {
  id: string;
  title: string;
  organization: string;
  experienceType: ExperienceType;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  subjects: string[];
  createdAt: string;
}

// API Methods
export const teacherApi = {
  // ... existing methods ...

  // Skills
  getSkills: () => api.get<TeacherSkill[]>('/teacher/skills').then(r => r.data),
  addSkill: (dto: CreateSkillDto) => api.post<TeacherSkill>('/teacher/skills', dto).then(r => r.data),
  updateSkill: (id: string, dto: UpdateSkillDto) => api.patch<TeacherSkill>(`/teacher/skills/${id}`, dto).then(r => r.data),
  removeSkill: (id: string) => api.delete(`/teacher/skills/${id}`),

  // Work Experience
  getWorkExperiences: () => api.get<TeacherWorkExperience[]>('/teacher/work-experiences').then(r => r.data),
  addWorkExperience: (dto: CreateWorkExperienceDto) => api.post<TeacherWorkExperience>('/teacher/work-experiences', dto).then(r => r.data),
  updateWorkExperience: (id: string, dto: UpdateWorkExperienceDto) => api.patch<TeacherWorkExperience>(`/teacher/work-experiences/${id}`, dto).then(r => r.data),
  removeWorkExperience: (id: string) => api.delete(`/teacher/work-experiences/${id}`),
};
```

### `apps/web/src/lib/api/marketplace.ts`

```typescript
export interface TeacherPublicProfile {
  // ... existing fields ...
  skills?: TeacherSkill[];
  workExperiences?: TeacherWorkExperience[];
}
```

---

## 10. Profile Completion

### IMPORTANT: These sections are OPTIONAL

**DO NOT** add skills or work experience to profile completion calculation.
- They should NOT block profile submission
- They should NOT affect the completion percentage
- They are purely for enhancing the teacher's public profile

---

## 11. Implementation Order

### Phase 1: Database & Backend (~3 hours)
1. Add Prisma models (enums + tables) and run migration
2. Create DTOs in shared package (Create + Update for each)
3. Implement Skills service with validation rules
4. Implement Skills controller
5. Implement Work Experience service with validation rules
6. Implement Work Experience controller
7. Update public profile query to include new data with proper sorting

### Phase 2: Frontend - Profile Hub (~4 hours)
1. Create `SkillsManager.tsx` component
2. Create `WorkExperienceManager.tsx` component
3. Create `SkillsExperienceSection.tsx` wrapper
4. Add section to Profile Hub page
5. Update navigation/sidebar

### Phase 3: Frontend - Public Profile (~2 hours)
1. Update `TeacherPublicProfile` type
2. Add skills display section with truncation
3. Add work experience display section with truncation
4. Handle empty states (preview vs public)
5. Handle inline expand for "show more"

### Phase 4: Testing & Polish (~2 hours)
1. Test all CRUD operations
2. Test empty/minimal/many data scenarios
3. Test preview mode vs public mode
4. Test date validation edge cases
5. RTL and Arabic text testing
6. Mobile responsiveness

**Total Estimate:** ~11 hours

---

## 12. UI/UX Labels & Icons

### Arabic Labels

| English | Arabic |
|---------|--------|
| Skills | المهارات |
| Work Experience | الخبرات العملية |
| Add Skill | إضافة مهارة |
| Add Experience | إضافة خبرة |
| Current Position | حاليًا |
| Currently Working | أعمل هنا حاليًا |
| Beginner | مبتدئ |
| Intermediate | متوسط |
| Advanced | متقدم |
| Expert | خبير |
| School | مدرسة |
| Tutoring Center | مركز تعليمي |
| Online Platform | منصة إلكترونية |
| Private Tutoring | دروس خصوصية |
| Other | أخرى |
| Teaching Methods | طرق التدريس |
| Technology | التقنيات |
| Soft Skills | المهارات الشخصية |
| Subject Specific | تخصصية |
| Show More | عرض المزيد |
| +X More | +X المزيد |

### Icons

| Element | Icon |
|---------|------|
| Skills section | `Award` or `Sparkles` |
| Work Experience section | `Briefcase` |
| School type | `Building2` |
| Tutoring Center type | `Users` |
| Online Platform type | `Globe` |
| Private type | `Home` |
| Add button | `Plus` |
| Edit button | `Edit2` |
| Delete button | `Trash2` |
| Current job badge | `CheckCircle2` (green) |
| Calendar/Date | `Calendar` |

---

## 13. File Structure Summary

```
packages/database/prisma/
├── schema.prisma                          # Add new models + enums

packages/shared/src/teacher/
├── skill.dto.ts                           # NEW (CreateSkillDto, UpdateSkillDto, enums)
├── work-experience.dto.ts                 # NEW (CreateWorkExperienceDto, UpdateWorkExperienceDto, enums)
├── index.ts                               # Export new DTOs

apps/api/src/teacher/
├── skills.controller.ts                   # NEW
├── skills.service.ts                      # NEW
├── work-experience.controller.ts          # NEW
├── work-experience.service.ts             # NEW
├── teacher.module.ts                      # Update to include new controllers

apps/web/src/components/teacher/
├── shared/
│   ├── SkillsManager.tsx                  # NEW
│   ├── WorkExperienceManager.tsx          # NEW
│   └── index.ts                           # Export new components
├── profile-hub/sections/
│   └── SkillsExperienceSection.tsx        # NEW
├── public-profile/
│   └── TeacherProfileView.tsx             # Update to show skills/experience

apps/web/src/lib/api/
├── teacher.ts                             # Add new API methods
├── marketplace.ts                         # Update TeacherPublicProfile type

apps/web/src/app/teacher/profile-hub/
└── page.tsx                               # Add new section
```

---

## 14. Risks & Edge Cases

| Risk | Mitigation |
|------|-----------|
| Skill duplicate race condition (service-level check) | Extremely unlikely for single-user CRUD; acceptable for MVP |
| Date validation complexity | Centralize in shared validation utility |
| Arabic text edge cases | Test with various Arabic inputs during QA |
| Long skill/organization names | Truncate with ellipsis in display (CSS) |
| Many concurrent positions | UI handles gracefully; all show "(حاليًا)" badge |

---

## 15. Notes

1. **No file uploads required** - Unlike qualifications, skills and work experience don't need certificate uploads
2. **Service-level uniqueness for skills** - DB constraint deferred for simplicity; normalized comparison in service
3. **Optional data** - Teachers can have zero skills/experiences
4. **Multiple current positions allowed** - Real-world scenario supported
5. **Backend handles all sorting** - Frontend renders in received order
6. **Security guaranteed** - Skills/experiences only exposed for APPROVED teachers via existing marketplace filter
