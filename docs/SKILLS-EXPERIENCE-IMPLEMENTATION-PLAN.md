# Skills & Work Experience Implementation Plan

## Overview

This document outlines the implementation plan for adding **Skills** and **Work Experience** sections to the teacher profile system. These sections will be **optional** (not affecting profile completion) and follow the same patterns as the existing `QualificationsManager` component.

---

## 1. Database Schema

### New Models in `prisma/schema.prisma`

```prisma
// Teacher's professional skills (e.g., "Classroom Management", "Online Teaching Tools")
model TeacherSkill {
  id             String         @id @default(uuid())
  teacherId      String
  teacherProfile TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  // Skill data
  name           String         // e.g., "استخدام التقنيات التعليمية الحديثة"
  category       SkillCategory? // TEACHING_METHOD, TECHNOLOGY, SOFT_SKILL, SUBJECT_SPECIFIC
  proficiency    SkillProficiency @default(INTERMEDIATE) // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

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
  endDate        DateTime?      // null = currently working here
  isCurrent      Boolean        @default(false)

  // Details
  description    String?        @db.Text // What they did, achievements
  subjects       String[]       // Subjects taught (free text array)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([teacherId])
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

### Skills Endpoints (Similar to Qualifications)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teacher/skills` | Get all skills for authenticated teacher |
| POST | `/teacher/skills` | Add a new skill |
| PATCH | `/teacher/skills/:id` | Update a skill |
| DELETE | `/teacher/skills/:id` | Remove a skill |

### Work Experience Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teacher/work-experiences` | Get all work experiences for authenticated teacher |
| POST | `/teacher/work-experiences` | Add a new work experience |
| PATCH | `/teacher/work-experiences/:id` | Update a work experience |
| DELETE | `/teacher/work-experiences/:id` | Remove a work experience |

### DTOs (`packages/shared/src/teacher/`)

```typescript
// create-skill.dto.ts
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

export class CreateSkillDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @IsOptional()
  @IsEnum(SkillProficiency)
  proficiency?: SkillProficiency;
}

// create-work-experience.dto.ts
export enum ExperienceType {
  SCHOOL = 'SCHOOL',
  TUTORING_CENTER = 'TUTORING_CENTER',
  ONLINE_PLATFORM = 'ONLINE_PLATFORM',
  PRIVATE = 'PRIVATE',
  OTHER = 'OTHER',
}

export class CreateWorkExperienceDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
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
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];
}
```

---

## 3. Frontend Components

### Profile Hub Structure

**New Section in Profile Hub Navigation:**

| Section ID | Arabic Label | Icon |
|------------|--------------|------|
| `skills-experience` | المهارات والخبرات | `Briefcase` or `Award` |

**Location:** After "المؤهلات والخبرات" (Qualifications) section

### New Components

#### 1. `SkillsExperienceSection.tsx` (Profile Hub Section Wrapper)

```
apps/web/src/components/teacher/profile-hub/sections/SkillsExperienceSection.tsx
```

Similar to `QualificationsSection.tsx` - wraps both managers with section header.

#### 2. `SkillsManager.tsx` (Shared Component)

```
apps/web/src/components/teacher/shared/SkillsManager.tsx
```

Pattern: Follow `QualificationsManager.tsx` exactly
- List existing skills with edit/delete buttons
- Add new skill form (inline, not modal)
- Empty state for no skills
- Loading state

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

---

## 4. Public Profile Display

### Location in TeacherProfileView.tsx

Add after the "Bio" section and before "Subjects" or as a new dedicated section.

### Display Scenarios

#### Scenario A: No Data (Empty)
- **In Preview Mode:** Show dashed placeholder: "لم تضف مهاراتك وخبراتك بعد"
- **In Public Mode:** Hide section entirely (don't show empty section to visitors)

#### Scenario B: Minimal Data (1-2 items each)
```
┌────────────────────────────────────────────┐
│ المهارات                                   │
│ ┌────────┐ ┌───────────────┐              │
│ │متقدم   │ │إدارة الفصل   │               │
│ └────────┘ └───────────────┘              │
│                                            │
│ الخبرات                                    │
│ معلم رياضيات • مدرسة الخرطوم • 2018-الآن   │
└────────────────────────────────────────────┘
```

#### Scenario C: Lots of Data (5+ items)
```
┌────────────────────────────────────────────┐
│ المهارات                                   │
│ ┌────────┐ ┌────────┐ ┌────────┐          │
│ │ مهارة1 │ │ مهارة2 │ │ مهارة3 │          │
│ └────────┘ └────────┘ └────────┘          │
│ ┌────────┐ ┌────────┐  [+2 المزيد]        │
│ │ مهارة4 │ │ مهارة5 │                     │
│ └────────┘ └────────┘                     │
│                                            │
│ الخبرات (5)                    [عرض الكل] │
│ ┌─────────────────────────────────────┐   │
│ │ معلم رياضيات • مدرسة الخرطوم (حاليًا)│   │
│ └─────────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐   │
│ │ مدرس خصوصي • 2015-2018              │   │
│ └─────────────────────────────────────┘   │
│ ... عرض المزيد                            │
└────────────────────────────────────────────┘
```

---

## 5. API Integration (Frontend)

### `apps/web/src/lib/api/teacher.ts`

Add new types and API methods:

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
  subjects?: string[];
  createdAt: string;
}

// API Methods
export const teacherApi = {
  // ... existing methods ...

  // Skills
  getSkills: () => api.get<TeacherSkill[]>('/teacher/skills').then(r => r.data),
  addSkill: (dto: CreateSkillDto) => api.post<TeacherSkill>('/teacher/skills', dto).then(r => r.data),
  updateSkill: (id: string, dto: CreateSkillDto) => api.patch<TeacherSkill>(`/teacher/skills/${id}`, dto).then(r => r.data),
  removeSkill: (id: string) => api.delete(`/teacher/skills/${id}`),

  // Work Experience
  getWorkExperiences: () => api.get<TeacherWorkExperience[]>('/teacher/work-experiences').then(r => r.data),
  addWorkExperience: (dto: CreateWorkExperienceDto) => api.post<TeacherWorkExperience>('/teacher/work-experiences', dto).then(r => r.data),
  updateWorkExperience: (id: string, dto: CreateWorkExperienceDto) => api.patch<TeacherWorkExperience>(`/teacher/work-experiences/${id}`, dto).then(r => r.data),
  removeWorkExperience: (id: string) => api.delete(`/teacher/work-experiences/${id}`),
};
```

### `apps/web/src/lib/api/marketplace.ts`

Update `TeacherPublicProfile` type to include skills and experiences:

```typescript
export interface TeacherPublicProfile {
  // ... existing fields ...
  skills?: TeacherSkill[];
  workExperiences?: TeacherWorkExperience[];
}
```

---

## 6. Profile Hub Navigation Update

### Update `ResponsiveSidebar.tsx` or Navigation Config

Add new section to navigation:

```typescript
{
  id: 'skills-experience',
  label: 'المهارات والخبرات',
  icon: Briefcase, // or Award
  description: 'أضف مهاراتك وخبراتك العملية',
}
```

**Position:** After "المؤهلات والخبرات" (qualifications section)

---

## 7. Backend Implementation

### New Controller: `apps/api/src/teacher/skills.controller.ts`

CRUD operations for skills, following same pattern as qualifications.

### New Controller: `apps/api/src/teacher/work-experience.controller.ts`

CRUD operations for work experiences.

### Update TeacherModule

Register new controllers and services.

### Update Public Profile Query

Include skills and work experiences in the teacher public profile response.

---

## 8. Profile Completion

### IMPORTANT: These sections are OPTIONAL

**DO NOT** add skills or work experience to profile completion calculation.
- They should NOT block profile submission
- They should NOT affect the completion percentage
- They are purely for enhancing the teacher's public profile

---

## 9. Implementation Order

### Phase 1: Database & Backend
1. Add Prisma models and run migration
2. Create DTOs in shared package
3. Implement Skills controller/service
4. Implement Work Experience controller/service
5. Update public profile query to include new data

### Phase 2: Frontend - Profile Hub
1. Create `SkillsManager.tsx` component
2. Create `WorkExperienceManager.tsx` component
3. Create `SkillsExperienceSection.tsx` wrapper
4. Add section to Profile Hub page
5. Update navigation/sidebar

### Phase 3: Frontend - Public Profile
1. Update `TeacherPublicProfile` type
2. Add skills display section
3. Add work experience display section
4. Handle empty states
5. Handle "show more" for many items

### Phase 4: Testing & Polish
1. Test all CRUD operations
2. Test empty/minimal/many data scenarios
3. Test preview mode
4. RTL and Arabic text testing
5. Mobile responsiveness

---

## 10. UI/UX Considerations

### Arabic Labels

| English | Arabic |
|---------|--------|
| Skills | المهارات |
| Work Experience | الخبرات العملية |
| Add Skill | إضافة مهارة |
| Add Experience | إضافة خبرة |
| Current Position | الوظيفة الحالية |
| Beginner | مبتدئ |
| Intermediate | متوسط |
| Advanced | متقدم |
| Expert | خبير |
| School | مدرسة |
| Tutoring Center | مركز تعليمي |
| Online Platform | منصة إلكترونية |
| Private Tutoring | دروس خصوصية |
| Teaching Methods | طرق التدريس |
| Technology | التقنيات |
| Soft Skills | المهارات الشخصية |
| Subject Specific | تخصصية |

### Icons

- Skills section: `Award` or `Sparkles`
- Work Experience: `Briefcase` or `Building2`
- Add button: `Plus`
- Edit: `Edit2` or `Pencil`
- Delete: `Trash2`
- Current job indicator: `CheckCircle2` (green)

---

## 11. File Structure Summary

```
packages/database/prisma/
├── schema.prisma                          # Add new models

packages/shared/src/teacher/
├── create-skill.dto.ts                    # NEW
├── create-work-experience.dto.ts          # NEW
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

## 12. Notes

1. **No file uploads required** - Unlike qualifications, skills and work experience don't need certificate uploads
2. **Simple validation** - Just basic field validation, no complex rules
3. **Optional data** - Teachers can have zero skills/experiences
4. **Sort order** - Work experiences should sort by most recent first (startDate DESC, isCurrent first)
5. **Skills display** - Consider grouping by category in public profile view
