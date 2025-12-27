# Curriculum System Audit Report

> **Audit Date:** 2025-12-27  
> **Scope:** Database models, backend logic, frontend usage for curriculum-related entities

---

## 1. Database Models (What Exists)

### 1.1 Curriculum
**Location:** `packages/database/prisma/schema.prisma` (Line 222)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (UUID) | Yes | Primary key |
| code | String | Yes | Unique identifier (e.g., "SUDANESE", "BRITISH") |
| nameAr | String | Yes | Arabic display name |
| nameEn | String | Yes | English display name |
| systemType | SystemType | Yes | Enum: `NATIONAL` or `INTERNATIONAL` |
| isActive | Boolean | Yes | Default: true (soft-delete flag) |

**Relations:**
- One-to-many → `EducationalStage[]`
- Many-to-many → `Subject[]` (via `CurriculumSubject`)
- One-to-many → `TeacherSubject[]`

---

### 1.2 EducationalStage
**Location:** Line 236

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (UUID) | Yes | Primary key |
| curriculumId | String | Yes | FK to Curriculum |
| nameAr | String | Yes | Arabic name (e.g., "أساس") |
| nameEn | String | Yes | English name (e.g., "Primary") |
| sequence | Int | Yes | Display order within curriculum |
| isActive | Boolean | Yes | Default: true |

**Relations:**
- Many-to-one → `Curriculum`
- One-to-many → `GradeLevel[]`

---

### 1.3 GradeLevel
**Location:** Line 249

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (UUID) | Yes | Primary key |
| stageId | String | Yes | FK to EducationalStage |
| nameAr | String | Yes | Arabic name |
| nameEn | String | Yes | English name |
| code | String | Yes | Short code (e.g., "SUD_P1", "Y7") |
| sequence | Int | Yes | Display order within stage |
| isActive | Boolean | Yes | Default: true |

**Unique Constraint:** `[stageId, code]`

**Relations:**
- Many-to-one → `EducationalStage`
- Many-to-many → `TeacherSubject[]` (via `TeacherSubjectGrade`)

---

### 1.4 Subject
**Location:** Line 264

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (UUID) | Yes | Primary key |
| nameAr | String | Yes | Arabic name |
| nameEn | String | Yes | English name |
| isActive | Boolean | Yes | Default: true |

**Relations:**
- Many-to-many → `Curriculum[]` (via `CurriculumSubject`)
- One-to-many → `TeacherSubject[]`
- One-to-many → `Booking[]`
- One-to-many → `StudentPackage[]`

> **IMPORTANT:** Subjects are **NOT curriculum-specific**. They are standalone entities linked to curricula via a join table.

---

### 1.5 CurriculumSubject (Join Table)
**Location:** Line 277

| Field | Type | Notes |
|-------|------|-------|
| curriculumId | String | Composite PK |
| subjectId | String | Composite PK |

**Purpose:** Links which subjects are available under which curriculum.

---

### 1.6 TeacherSubject
**Location:** Line 287

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String (UUID) | Yes | Primary key |
| teacherId | String | Yes | FK to TeacherProfile |
| subjectId | String | Yes | FK to Subject |
| curriculumId | String | Yes | FK to Curriculum |
| pricePerHour | Decimal | Yes | Teacher's hourly rate for this subject |

**Relations:**
- Many-to-one → `TeacherProfile`
- Many-to-one → `Subject`
- Many-to-one → `Curriculum`
- Many-to-many → `GradeLevel[]` (via `TeacherSubjectGrade`)

---

### 1.7 TeacherSubjectGrade (Join Table)
**Location:** Line 301

| Field | Type | Notes |
|-------|------|-------|
| teacherSubjectId | String | Composite PK |
| gradeLevelId | String | Composite PK |

**Purpose:** Links which grades a teacher can teach for a specific subject+curriculum combination.

---

## 2. Backend Implementation

### 2.1 API Endpoints (MarketplaceController)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/marketplace/curricula` | GET | Public | List all curricula (active only by default) |
| `/marketplace/curricula` | POST | Admin | Create curriculum |
| `/marketplace/curricula/:id` | GET | Public | Get single curriculum |
| `/marketplace/curricula/:id` | PATCH | Admin | Update curriculum |
| `/marketplace/curricula/:id` | DELETE | Admin | Soft-delete curriculum |
| `/marketplace/stages` | GET | Public | List stages (optional: filter by curriculumId) |
| `/marketplace/stages` | POST | Admin | Create stage |
| `/marketplace/stages/:id` | PATCH | Admin | Update stage |
| `/marketplace/stages/:id` | DELETE | Admin | Soft-delete stage |
| `/marketplace/grades` | GET | Public | List grades (optional: filter by stageId) |
| `/marketplace/grades` | POST | Admin | Create grade |
| `/marketplace/grades/:id` | PATCH | Admin | Update grade |
| `/marketplace/grades/:id` | DELETE | Admin | Soft-delete grade |
| `/marketplace/subjects` | GET | Public | List subjects |
| `/marketplace/subjects` | POST | Admin | Create subject |
| `/marketplace/subjects/:id` | PATCH | Admin | Update subject |
| `/marketplace/subjects/:id` | DELETE | Admin | Soft-delete subject |

### 2.2 Search API

**Endpoint:** `GET /marketplace/teachers`

**Filters supported:**
- `subjectId` - Filter by subject
- `curriculumId` - Filter by curriculum
- `gradeLevelId` - Filter by grade (matches via `TeacherSubjectGrade`)
- `maxPrice` - Filter by price

**Implementation:** Queries `TeacherSubject` table with optional joins.

---

## 3. Frontend Usage

### 3.1 Public Search Page (`/search`)
- Curriculum dropdown populated from `/marketplace/curricula`
- Grade dropdown populated from `/marketplace/stages` + `/marketplace/grades`
- Cascading filters: Curriculum → Stages → Grades
- Search sends `curriculumId`, `gradeId` as query params

### 3.2 Homepage Hero Section
- Same curriculum/grade filters as search
- Redirects to search with params

### 3.3 Teacher Onboarding (`SubjectsStep`)
- Teacher selects: Curriculum → Subject → Grades
- Creates `TeacherSubject` record with price
- Links grades via `TeacherSubjectGrade`

### 3.4 Admin Content Management (`/admin/content`)
- Full CRUD for: Curricula, Stages, Grades, Subjects
- Stages require parent `curriculumId`
- Grades require parent `stageId`
- Subjects are standalone (no curriculum/stage parent)

---

## 4. Current Behavior by Curriculum Type

### 4.1 Sudanese Curriculum (NATIONAL)
| Entity | Data |
|--------|------|
| Code | `SUDANESE` |
| SystemType | `NATIONAL` |
| Stages | أساس (Primary), متوسط (Intermediate), ثانوي (Secondary) |
| Grades | صف 1-6, أول-ثالث متوسط, أول-ثالث ثانوي |

### 4.2 British Curriculum (INTERNATIONAL)
| Entity | Data |
|--------|------|
| Code | `BRITISH` |
| SystemType | `INTERNATIONAL` |
| Stages | Primary, Lower Secondary, GCSE, A-Level |
| Grades | Year 1-13 |

> **Note:** Both curricula currently behave identically. The `SystemType` enum has no functional impact in the current codebase.

---

## 5. Hard Assumptions Baked Into the System

1. **Single-track curricula** - No support for "Cambridge IGCSE" vs "Edexcel IGCSE" under British curriculum
2. **Subjects are universal** - Same "Mathematics" subject for all curricula (no curriculum-specific subject variants)
3. **Flat grade naming** - No support for "Year 10 (IGCSE)" vs "Year 10 (Foundation)" variants
4. **No exam boards** - No entity for Cambridge, Edexcel, AQA, etc.
5. **No content providers** - No concept of who provides the curriculum content
6. **SystemType is display-only** - The NATIONAL/INTERNATIONAL distinction has no logic attached

---

## 6. Missing Abstraction Layers

| Missing Entity | Would Enable |
|----------------|--------------|
| **CurriculumTrack** | Cambridge IGCSE, Edexcel IGCSE, Oxford IGCSE under "British" |
| **ExamBoard / ContentProvider** | Cambridge, Edexcel, AQA, IB, etc. |
| **CurriculumSubjectVariant** | "IGCSE Mathematics" vs "A-Level Mathematics" |
| **StageLevel** | Key Stage 3, Key Stage 4 for British |
| **StudentCurriculumProfile** | Link student/child to their specific curriculum+track |

---

## 7. Coupling & Expansion Risks

### 7.1 If Adding Curriculum Tracks (e.g., Cambridge, Edexcel)

| Issue | Impact |
|-------|--------|
| No `Track` entity in schema | Would need new model + migrations |
| `TeacherSubject` links directly to Curriculum | Would need `trackId` field or restructure |
| Search filters assume flat curriculum structure | UI would need track selector |
| Booking stores `subjectId` only | No record of which track was taught |
| No teacher-track assignment | Can't filter teachers by track expertise |

### 7.2 Subject Handling

| Issue | Impact |
|-------|--------|
| Subjects are not curriculum-specific | "Physics" is same for Sudanese and IGCSE |
| No subject versioning | Can't handle "IGCSE Physics 2024 syllabus" |
| `CurriculumSubject` is just a link | No additional metadata (code, weight, etc.) |

### 7.3 Student Profile

| Issue | Impact |
|-------|--------|
| `StudentProfile.gradeLevel` is just a string | Not linked to `GradeLevel` entity |
| `Child.gradeLevel` is just a string | Same issue |
| No `curriculumId` on student/child | Can't filter teachers by student's curriculum |

---

## 8. Implementation Status Summary

### ✅ Fully Implemented
- Curriculum CRUD (Admin)
- EducationalStage CRUD (Admin)
- GradeLevel CRUD (Admin)
- Subject CRUD (Admin, but standalone)
- Teacher subject/grade assignment (Onboarding)
- Search by curriculum/grade (Public)
- Cascading curriculum→stage→grade hierarchy

### 🟡 Partially Implemented
- `SystemType` enum exists but has no behavioral logic
- `CurriculumSubject` join table exists but rarely used
- Grade filtering in search (via `TeacherSubjectGrade`)

### ❌ Completely Missing
- Curriculum Tracks / Content Providers
- Exam Boards (Cambridge, Edexcel, etc.)
- Student curriculum preference storage
- Subject variants per curriculum
- Track-based teacher filtering
- Any British-specific logic (all curricula behave identically)

---

## 9. Data Notes

> All existing data is development/demo data and can be deleted or migrated in future phases.

**Current seed data:**
- 2 Curricula (Sudanese, British)
- 7 Stages (3 Sudanese, 4 British)
- 24 Grades total
- Subjects created separately (not part of curriculum seed)

---

*End of Audit Report*
