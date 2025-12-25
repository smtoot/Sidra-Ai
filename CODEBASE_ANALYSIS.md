# Sidra-Ai Platform - Comprehensive Codebase Analysis

**Analysis Date**: December 25, 2025
**Project Type**: Education Marketplace Platform
**Architecture**: Turborepo Monorepo

---

## Table of Contents

1. [Project Structure and Architecture](#1-project-structure-and-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Core Domain Concepts](#3-core-domain-concepts-and-business-logic)
4. [Key Features and Functionality](#4-key-features-and-functionality)
5. [Data Models and Relationships](#5-data-models-and-relationships)
6. [API Structure and Endpoints](#6-api-structure-and-endpoints)
7. [Frontend Routing and Pages](#7-frontend-routing-and-pages)
8. [Authentication and Authorization](#8-authentication-and-authorization-approach)
9. [Notable Patterns and Decisions](#9-notable-patterns-and-architectural-decisions)
10. [Project Maturity Assessment](#10-project-maturity-indicators)

---

## 1. Project Structure and Architecture

### Monorepo Architecture

**Build System**: Turborepo-based monorepo with npm workspaces
**Package Manager**: npm@10.2.4

```
sidra-monorepo/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   └── web/          # Next.js frontend (port 3002)
└── packages/
    ├── database/     # Prisma schema & migrations
    └── shared/       # Shared DTOs, enums, types
```

### Key Characteristics

- **Turborepo Pipeline**: Parallel builds with intelligent caching
- **Code Sharing**: DTOs, enums, and types shared between API and Web
- **Single Source of Truth**: Prisma schema in database package
- **Development**: Docker Compose for local PostgreSQL

---

## 2. Technology Stack

### Backend (API)

| Category | Technology |
|----------|------------|
| **Framework** | NestJS 11.x (TypeScript) |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5.22 |
| **Authentication** | JWT with Passport.js |
| **Password Hashing** | bcrypt |
| **Scheduling** | @nestjs/schedule (cron jobs) |
| **Rate Limiting** | @nestjs/throttler |
| **Email** | @sendgrid/mail |
| **File Storage** | AWS S3 (@aws-sdk/client-s3) |
| **File Upload** | multer |
| **Timezone** | date-fns-tz |

### Frontend (Web)

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI (Dialog, Label, Switch) |
| **Icons** | lucide-react |
| **Animations** | framer-motion |
| **State Management** | React Context + @tanstack/react-query |
| **Forms** | react-hook-form |
| **HTTP Client** | axios |
| **Date Formatting** | date-fns |
| **Notifications** | sonner (toast notifications) |
| **Class Utilities** | clsx + tailwind-merge |

### Database

- **Primary DB**: PostgreSQL
- **ORM**: Prisma with seeding support
- **Deployment**: Docker Compose for local development

---

## 3. Core Domain Concepts and Business Logic

### User Roles and Identity

#### Phone-First Authentication
- **Primary Identifier**: Phone number (unique, required)
- **Secondary Identifier**: Email (optional, unique if provided)
- **Authentication Method**: Password-based with JWT tokens

#### User Roles
1. **PARENT** - Books sessions for their children
2. **STUDENT** - Standalone students booking for themselves
3. **TEACHER** - Provides tutoring sessions
4. **ADMIN** - Platform management
5. **SUPPORT** - Customer support role

### Educational Hierarchy

```
SystemType (NATIONAL | INTERNATIONAL)
└── Curriculum (e.g., "Sudanese National", "IGCSE")
    └── EducationalStage (e.g., "Primary", "Secondary")
        └── GradeLevel (e.g., "Grade 1", "Grade 2")
            └── Subject (e.g., "Math", "Science")
```

### Teacher Onboarding & Approval System

#### Application Statuses
- `DRAFT` - Initial incomplete profile
- `SUBMITTED` - Awaiting admin review
- `CHANGES_REQUESTED` - Admin requested modifications
- `INTERVIEW_REQUIRED` - Needs interview scheduling
- `INTERVIEW_SCHEDULED` - Interview booked
- `APPROVED` - Can start teaching
- `REJECTED` - Application denied

#### KYC Requirements
- Personal info (name, DOB, city, country)
- Professional info (education, experience, bio)
- Documents (ID, certificates, degrees)
- Bank details for payouts
- Teaching subjects & prices
- Availability schedule
- Meeting link (encrypted)

---

## 4. Key Features and Functionality

### A. Booking System (Session Management)

#### Booking Lifecycle

```
PENDING_TEACHER_APPROVAL
    ↓ (Teacher Approves)
WAITING_FOR_PAYMENT (if insufficient balance)
    ↓ (Parent Pays)
SCHEDULED (funds locked in escrow)
    ↓ (Teacher completes)
PENDING_CONFIRMATION (dispute window: 48h)
    ↓ (Student confirms or auto-release)
COMPLETED (funds released to teacher)
```

#### Alternative Flows
- `REJECTED_BY_TEACHER` - Teacher declines
- `CANCELLED_BY_PARENT` - Parent cancels (policy-based refunds)
- `CANCELLED_BY_ADMIN` - Admin intervention
- `DISPUTED` - Student raises issue
- `EXPIRED` - Payment deadline missed

#### Booking Types
1. **Single Sessions** - One-time bookings
2. **Package Sessions** - Bulk purchase with discount
3. **Demo Sessions** - Free trial (one per teacher per parent/student)

#### Price Calculation
- **Server-side only** - Client price ignored for security
- Formula: `pricePerHour × durationHours`
- Normalized to integer using `normalizeMoney()` utility
- Commission: Default 18% (configurable in SystemSettings)

#### Slot Validation

Checks before booking creation:
1. Teacher's weekly availability (day/time in their timezone)
2. Availability exceptions (holidays, blocked times)
3. Existing bookings (no double-booking)
4. Time zone conversions (UTC storage, local display)

---

### B. Wallet & Financial System

#### Escrow-Based Payment Flow
1. **Deposit** - Parent deposits funds (admin approval required)
2. **Payment Lock** - Funds moved to `pendingBalance` on approval
3. **Payment Release** - Funds to teacher after session completion
4. **Commission** - Platform takes 18% on release

#### Transaction Types
- `DEPOSIT` - Parent adds funds
- `WITHDRAWAL` - Teacher requests payout
- `PAYMENT_LOCK` - Escrow for booking
- `PAYMENT_RELEASE` - Teacher payment
- `REFUND` - Cancellation refund
- `CANCELLATION_COMPENSATION` - Teacher compensation
- `PACKAGE_PURCHASE` - Bulk session purchase
- `PACKAGE_RELEASE` - Per-session teacher payment

#### Money Normalization
- All amounts stored as **integers** (no decimal cents)
- Utility: `normalizeMoney()` rounds to nearest whole number
- Prevents floating-point errors

#### Readable IDs

Human-friendly transaction IDs:
- Format: `{PREFIX}-{YYMM}-{COUNTER}`
- Examples: `BK-2412-0042`, `TXN-2412-0015`, `PKG-2412-0008`
- Counters reset monthly

---

### C. Package System

#### Package Tiers (Admin-Configurable)
- **5 sessions** - e.g., 10% discount
- **10 sessions** - e.g., 15% discount
- **20 sessions** - e.g., 20% discount

#### Package Purchase Flow
1. Parent selects tier during booking
2. Teacher approves → triggers package purchase
3. Full amount deducted from wallet
4. Sessions redeemed one-by-one
5. Funds released incrementally per completed session

#### Anti-Abuse Measures
- **Package Redemption** tracking prevents double-usage
- **Idempotency keys** prevent duplicate purchases
- **Status tracking**: `RESERVED → RELEASED → COMPLETED`
- **Expiry**: 90 days from purchase

---

### D. Demo Sessions

#### Demo Quota System
- **One demo per teacher per owner** (lifetime)
- Owner = Parent (for child bookings) or Student (for self)
- Enforced via unique constraint: `(demoOwnerId, teacherId)`

#### Demo Lifecycle
- Teacher must enable demos (`TeacherDemoSettings`)
- Free session (price = 0)
- No wallet transactions
- Counted toward quota on creation (not completion)
- Cancellation counts toward quota (prevents abuse)

---

### E. Dispute & Confirmation System

#### Dispute Window (48 hours)

After teacher marks session complete:
- **T+0h**: Teacher clicks "Complete" → `PENDING_CONFIRMATION`
- **T+0h**: Student notified
- **T+42h**: Reminder notification
- **T+48h**: Auto-release if no dispute

#### Dispute Types
- `TEACHER_NO_SHOW` - Teacher absent
- `SESSION_TOO_SHORT` - Duration mismatch
- `QUALITY_ISSUE` - Teaching quality
- `TECHNICAL_ISSUE` - Platform problems
- `OTHER` - Miscellaneous

#### Admin Resolution
- `RESOLVED_TEACHER_WINS` - Full payment to teacher
- `RESOLVED_STUDENT_WINS` - Full refund to student
- `RESOLVED_SPLIT` - Partial for both
- `DISMISSED` - Invalid dispute

---

### F. Cancellation Policy System

#### Policy Types

**1. FLEXIBLE**
- >24h: 100% refund
- <24h: 50% refund

**2. MODERATE**
- >48h: 100% refund
- 24-48h: 50% refund
- <24h: No refund

**3. STRICT**
- >72h: 100% refund
- 48-72h: 50% refund
- <48h: No refund

#### Grace Period
- First 1 hour after booking: 100% refund always
- Teacher cancellation: Always 100% refund to student

---

### G. Reschedule System (Package Sessions)

#### Student/Parent Direct Reschedule
- **Window**: Must be >24h before session
- **Max Count**: 2 reschedules per session
- **Restrictions**: Only `SCHEDULED` status
- Availability check enforced

#### Teacher Reschedule Request
- **Window**: Must be >48h before session
- **Max Requests**: 2 per booking
- **Approval Required**: Student/parent must approve within timeout
- **Timeout**: 72 hours (configurable)
- **Lazy Expiration**: Status updated on access, not cron

---

### H. Notification System

#### Channels
- In-app notifications (Notification model)
- Email (via SendGrid, Outbox pattern)

#### Notification Types
- `BOOKING_REQUEST` - New booking for teacher
- `BOOKING_APPROVED` - Teacher approved
- `BOOKING_REJECTED` - Teacher declined
- `BOOKING_CANCELLED` - Cancellation
- `PAYMENT_SUCCESS` - Payment confirmed
- `PAYMENT_RELEASED` - Funds to teacher
- `ESCROW_REMINDER` - Dispute window reminder
- `DEPOSIT_APPROVED/REJECTED` - Wallet deposits
- `DISPUTE_RAISED/UPDATE` - Dispute events
- `SYSTEM_ALERT` - General alerts

#### Deduplication
- `dedupeKey` field prevents duplicate notifications
- Format: `{EVENT_TYPE}:{resourceId}:{userId}`

---

### I. Teacher Availability System

#### Weekly Recurring Slots

```prisma
model Availability {
  dayOfWeek  DayOfWeek  // MONDAY, TUESDAY, etc.
  startTime  String     // "09:00" in teacher's timezone
  endTime    String     // "17:00" in teacher's timezone
  isRecurring Boolean
}
```

#### Exceptions

```prisma
model AvailabilityException {
  type       ExceptionType  // ALL_DAY | PARTIAL_DAY
  startDate  DateTime       // UTC midnight
  endDate    DateTime       // UTC midnight
  startTime  String?        // For PARTIAL_DAY (teacher TZ)
  endTime    String?        // For PARTIAL_DAY (teacher TZ)
}
```

#### Timezone Handling
- **Storage**: Times in teacher's local timezone
- **Computation**: Convert to UTC for comparisons
- **Display**: Convert to user's timezone
- Utility: `formatInTimezone()` from `date-fns-tz`

---

### J. Rating & Review System

#### Rating Flow
1. Booking must be `COMPLETED`
2. One rating per booking
3. Score: 1-5 stars (validated)
4. Optional comment (text)
5. Atomic update of teacher aggregates:
   - `averageRating` (running average)
   - `totalReviews` (count)

#### Moderation
- `isVisible` flag for soft moderation
- Admin can hide inappropriate reviews

---

### K. Admin Features

#### Dashboard
- User/booking/dispute counts
- Financial metrics (deposits, withdrawals, volume)
- Recent activity feed

#### Teacher Management
- Application review (approve/reject/request changes)
- Interview scheduling
- Manual approval override

#### Financial Management
- Deposit approval/rejection
- Withdrawal processing (with bank details snapshot)
- Transaction history with filters
- Payout batching

#### Dispute Resolution
- View all disputes with evidence
- Split resolution options
- Notification to parties

#### Content Management
- Curricula, subjects, stages, grades (CRUD)
- Package tier configuration
- System settings (commission, dispute window, etc.)

#### Audit Logging

```prisma
enum AuditAction {
  SETTINGS_UPDATE
  USER_BAN | USER_UNBAN | USER_VERIFY | USER_REJECT
  DISPUTE_RESOLVE | DISPUTE_DISMISS
  PAYOUT_PROCESS
  BOOKING_CANCEL
  REFUND_PROCESS
}
```

---

## 5. Data Models and Relationships

### Core Entities

#### User
- **Identity**: `phoneNumber` (unique), `email?` (unique)
- **Polymorphic profiles**: `ParentProfile | TeacherProfile | StudentProfile`
- **One wallet per user**
- **Multiple bookings** (as booker or beneficiary)

#### TeacherProfile
- **Personal**: `displayName`, `fullName`, `bio`, `dateOfBirth`
- **Professional**: `education`, `yearsOfExperience`, `timezone`
- **Media**: `profilePhotoUrl`, `introVideoUrl`
- **Application**: `applicationStatus`, `submittedAt`, `reviewedAt`
- **Ratings**: `averageRating`, `totalReviews`, `totalSessions`
- **Relations**: `subjects[]`, `availability[]`, `documents[]`, `bankInfo`

#### ParentProfile
- **Children management**: `children[]` (Child model)
- **Contact**: `whatsappNumber`, `city`, `country`

#### Child
- Belongs to parent
- `name`, `gradeLevel`
- Can be booking beneficiary

#### Booking

**Key Fields**:
- **Payer**: `bookedByUserId` (Parent or Student)
- **Beneficiary**: Polymorphic
  - `beneficiaryType: CHILD` → `childId` (not a User)
  - `beneficiaryType: STUDENT` → `studentUserId`
- **Session Details**: `startTime`, `endTime`, `timezone`, `meetingLink`
- **Pricing**: `price`, `commissionRate`
- **Notes**: `bookingNotes`, `teacherPrepNotes`, `teacherSummary`
- **Dispute Window**: `disputeWindowOpensAt`, `disputeWindowClosesAt`
- **Escrow**: `paymentLockedAt`, `paymentReleasedAt`, `paymentDeadline`
- **Package**: `pendingTierId` (for deferred package purchase)
- **Reschedule**: `rescheduleCount`, `lastRescheduledAt`, `rescheduledByRole`

#### Wallet
- `balance` - Available funds
- `pendingBalance` - Locked in escrow
- `currency` - Default "SDG" (Sudanese Pound)

#### Transaction
- `amount`, `type`, `status`
- `referenceImage` - Receipt upload
- `adminNote` - Admin comments
- `bankSnapshot` - JSON of bank details at time of payout
- `proofDocumentId`, `referenceId`, `paidAt`

#### StudentPackage

**Immutable Pricing** (snapshot at purchase time):
- `originalPricePerSession`
- `discountedPricePerSession`
- `perSessionReleaseAmount`
- `totalPaid`

**Usage Tracking**:
- `sessionCount`, `sessionsUsed`

**Escrow**:
- `escrowRemaining` (decrements per session)

**Status**: `ACTIVE → DEPLETED → COMPLETED`
**Expiry**: 90 days from `purchasedAt`

#### PackageRedemption
- Links `StudentPackage` to `Booking`
- Status: `RESERVED → RELEASED` (or `CANCELLED`)
- Prevents double-usage via unique constraint

#### DemoSession
- **Anti-Abuse**: Unique constraint `(demoOwnerId, teacherId)`
- **Quota Owner**: Parent or Student (not Child)
- **Beneficiary**: Child ID (optional)
- **Statuses**: `SCHEDULED`, `COMPLETED`, `CANCELLED`
- Cancellation counts toward lifetime quota

#### Dispute
- One per booking (unique constraint)
- `type`, `description`, `evidence[]`
- `raisedByUser`, `resolvedByAdmin`
- Resolution fields: `teacherPayout`, `studentRefund`

#### Rating
- One per booking (unique constraint)
- `score` (1-5), `comment?`
- `isVisible` (moderation flag)

---

## 6. API Structure and Endpoints

### Authentication (`/auth`)

```
POST   /auth/register          - Create account
POST   /auth/login             - Login (phone or email)
GET    /auth/profile           - Get current user
POST   /auth/change-password   - Update password
```

### Bookings (`/bookings`)

```
POST   /bookings                     - Create booking
PATCH  /bookings/:id/approve         - Teacher approves
PATCH  /bookings/:id/reject          - Teacher rejects
PATCH  /bookings/:id/pay             - Parent pays
PATCH  /bookings/:id/complete-session - Teacher completes
PATCH  /bookings/:id/confirm-early   - Student confirms
POST   /bookings/:id/rate            - Rate session
POST   /bookings/:id/dispute         - Raise dispute
GET    /bookings/:id/cancel-estimate - Preview cancellation
PATCH  /bookings/:id/cancel          - Cancel booking
PATCH  /bookings/:id/teacher-notes   - Update teacher notes
GET    /bookings/teacher/requests    - Pending approvals
GET    /bookings/teacher/my-sessions - All teacher sessions
GET    /bookings/parent/my-bookings  - Parent's bookings
GET    /bookings/student/my-bookings - Student's bookings
GET    /bookings/:id                 - Single booking details
```

### Wallet (`/wallet`)

```
GET    /wallet/balance              - Get balance
POST   /wallet/deposit              - Request deposit
POST   /wallet/withdraw             - Request withdrawal
GET    /wallet/transactions         - Transaction history
PATCH  /wallet/bank-info            - Update bank details
```

### Teacher (`/teacher`)

```
POST   /teacher/subjects            - Add teaching subject
DELETE /teacher/subjects/:id        - Remove subject
PATCH  /teacher/profile             - Update profile
POST   /teacher/availability        - Add availability slot
DELETE /teacher/availability/:id    - Remove slot
POST   /teacher/exceptions          - Add exception
DELETE /teacher/exceptions/:id      - Remove exception
POST   /teacher/documents           - Upload document
GET    /teacher/me/application-status - Check onboarding status
POST   /teacher/submit-application  - Submit for review
GET    /teacher/:slug               - Public profile
POST   /teacher/reschedule-request  - Request reschedule
```

### Packages (`/packages`)

```
GET    /packages/tiers              - Get active tiers
POST   /packages/purchase           - Buy package
GET    /packages/my-packages        - User's packages
GET    /packages/:id                - Package details
POST   /packages/:id/schedule       - Book session from package
```

### Marketplace (`/marketplace`)

```
POST   /marketplace/search          - Search teachers
GET    /marketplace/curricula       - List curricula
GET    /marketplace/subjects        - List subjects
GET    /marketplace/grades          - List grades by stage
GET    /marketplace/teacher-availability/:id - Get availability
```

### Admin (`/admin`)

```
GET    /admin/dashboard             - Stats overview
GET    /admin/bookings              - All bookings (filtered)
PATCH  /admin/bookings/:id/cancel   - Cancel booking
GET    /admin/disputes              - All disputes
POST   /admin/disputes/:id/resolve  - Resolve dispute
GET    /admin/transactions          - Financial transactions
PATCH  /admin/transactions/:id/process - Approve/reject
GET    /admin/users                 - User management
PATCH  /admin/users/:id/ban         - Ban user
GET    /admin/teachers/applications - Pending teachers
PATCH  /admin/teachers/:id/approve  - Approve teacher
POST   /admin/curricula             - CRUD operations
POST   /admin/package-tiers         - Manage tiers
PATCH  /admin/settings              - System settings
```

### Notifications (`/notifications`)

```
GET    /notifications               - User's notifications
PATCH  /notifications/:id/read      - Mark as read
DELETE /notifications/:id           - Archive notification
```

### Upload (`/upload`)

```
POST   /upload/presigned-url        - Get S3 upload URL
GET    /storage/file/:key           - Download file
```

---

## 7. Frontend Routing and Pages

### Public Routes
- `/` - Landing page
- `/login` - Login form
- `/register` - Registration form
- `/search` - Teacher search (marketplace)
- `/teachers/:slug` - Teacher public profile

### Parent Dashboard (`/parent`)
- `/parent` - Dashboard (overview, quick actions)
- `/parent/bookings` - Booking history
- `/parent/bookings/:id` - Booking details
- `/parent/children` - Manage children
- `/parent/packages/:id` - Package details
- `/parent/wallet` - Wallet & transactions
- `/parent/profile` - Edit profile
- `/parent/settings` - Account settings

### Student Dashboard (`/student`)
- `/student` - Dashboard
- `/student/bookings` - Booking history
- `/student/bookings/:id` - Booking details
- `/student/packages/:id` - Package details
- `/student/wallet` - Wallet
- `/student/profile` - Edit profile
- `/student/settings` - Account settings

### Teacher Dashboard (`/teacher`)
- `/teacher` - Dashboard (earnings, upcoming sessions)
- `/teacher/onboarding` - Multi-step onboarding wizard
- `/teacher/profile-hub` - Comprehensive profile editor:
  - Personal info, qualifications, teaching approach
  - Subjects & pricing, availability, bank info
  - Profile preview modal
- `/teacher/requests` - Booking requests (pending approval)
- `/teacher/sessions` - All sessions (calendar view)
- `/teacher/sessions/:id` - Session details
- `/teacher/packages` - Package enrollments
- `/teacher/subjects` - Manage subjects taught
- `/teacher/availability` - Schedule editor
- `/teacher/settings` - Account settings
- `/teacher/wallet` - Earnings & withdrawals

### Admin Dashboard (`/admin`)
- `/admin/financials` - Revenue, payouts, deposits
- `/admin/transactions` - Transaction management
- `/admin/bookings` - All platform bookings
- `/admin/disputes` - Dispute resolution
- `/admin/teachers` - Teacher list
- `/admin/teacher-applications` - Pending approvals
- `/admin/users` - User management
- `/admin/users/:id` - User details
- `/admin/content` - Curricula/subjects CRUD
- `/admin/packages` - Package tier configuration
- `/admin/demo` - Demo settings
- `/admin/settings` - System settings
- `/admin/audit-logs` - Audit trail
- `/admin/payouts` - Payout processing
- `/admin/tags` - Teaching approach tags

---

## 8. Authentication and Authorization Approach

### JWT-Based Authentication

```typescript
interface JwtPayload {
  sub: string;           // userId
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}
```

### Token Management
- **Storage**: `localStorage` (browser)
- **Transmission**: `Authorization: Bearer <token>` header
- **Expiry**: Not explicitly configured (default NestJS JWT)
- **Refresh**: Not implemented (user must re-login)

### Guards

#### `JwtAuthGuard`
- Validates JWT token
- Attaches `user` to request object
- Used on all protected routes

#### `RolesGuard`
- Checks `@Roles()` decorator
- Compares `user.role` to allowed roles
- Throws `ForbiddenException` if unauthorized

#### `ApprovalGuard` (Teachers)
- Ensures teacher has `applicationStatus: APPROVED`
- Prevents unapproved teachers from accessing features
- Used on teacher dashboard routes

### Protected Route Example

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
async getTeacherSessions(@Request() req: any) {
  // Only approved teachers can access
}
```

### Frontend Authorization

```typescript
// AuthContext checks localStorage token
// Decodes JWT to get role
// Redirects based on role:
// - PARENT → /parent
// - STUDENT → /student
// - TEACHER → /teacher (or /teacher/onboarding if DRAFT)
// - ADMIN → /admin/financials
```

### Public Decorator

```typescript
@Public()  // Bypasses JwtAuthGuard
@Get('health')
healthCheck() { return 'OK'; }
```

---

## 9. Notable Patterns and Architectural Decisions

### A. Monorepo Organization
- **Shared Package**: DTOs, enums, types shared between API and Web
- **Database Package**: Prisma schema as single source of truth
- **Turbo Pipeline**: Parallel builds, intelligent caching

### B. Money Normalization

**Problem**: Floating-point arithmetic errors
**Solution**: Store all amounts as **integers** (whole numbers)

```typescript
// Before: 100.5 * 1.18 = 118.58999999999999
// After: Math.round(100.5 * 1.18) = 119
export const normalizeMoney = (amount: number) => Math.round(amount);
```

### C. Escrow Pattern

**Purpose**: Protect both students and teachers

**Flow**:
1. Lock funds on booking approval (`pendingBalance`)
2. Hold until session completion
3. Release to teacher (minus commission)
4. Refund to student if dispute won

### D. Atomic Transactions

**Critical Operations**:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock wallet
  // 2. Update booking status
  // 3. Create transaction record
  // All or nothing
});
```

### E. Idempotency

**Pattern**: Idempotency keys prevent duplicate operations

```typescript
const existing = await prisma.packageTransaction.findUnique({
  where: { idempotencyKey }
});
if (existing) return existing.packageId; // Already processed
```

**Use Cases**:
- Package purchases
- Payment releases
- Wallet transactions

### F. Conditional Updates (Race Safety)

**Pattern**: Update only if conditions still match

```typescript
const result = await prisma.booking.updateMany({
  where: {
    id: bookingId,
    status: 'PENDING_CONFIRMATION', // Conditional!
    rescheduleCount: currentCount
  },
  data: { status: 'COMPLETED' }
});
if (result.count === 0) throw new ConflictException('Race condition');
```

### G. Readable ID Pattern

**Problem**: UUIDs are not user-friendly
**Solution**: Human-readable IDs with counters

```typescript
// Format: {PREFIX}-{YYMM}-{COUNTER}
// Examples: BK-2412-0042, TXN-2412-0015
const readableId = await readableIdService.generate('BOOKING');
```

**Counter Reset**:
- Bookings/Transactions: Monthly
- Wallets: Never (sequential)

### H. Timezone Strategy

**Philosophy**: "Store UTC, Display Local"

1. **Booking Times**: Always stored in UTC
2. **Teacher Availability**: Stored in teacher's local timezone
3. **Comparisons**: Convert to UTC before comparing
4. **Display**: Convert to user's timezone

```typescript
// Storage
booking.startTime = new Date('2024-12-25T10:00:00Z'); // UTC

// Teacher availability
availability.startTime = '09:00'; // In teacher's timezone
availability.endTime = '17:00';

// Validation
const teacherTime = parseTimeInTimezoneToUTC(
  booking.startTime,
  teacher.timezone
);
```

### I. Polymorphic Beneficiaries

**Challenge**: Bookings can be for Children (not Users) or Students (Users)
**Solution**:

```typescript
beneficiaryType: 'CHILD' | 'STUDENT'
childId?: string          // If CHILD
studentUserId?: string    // If STUDENT
```

### J. Notification Deduplication

**Pattern**: Prevent spam via unique keys

```typescript
dedupeKey: `BOOKING_APPROVED:${bookingId}:${userId}`
// Database ensures uniqueness
```

### K. Transactional Outbox (Email)

**Pattern**: Async email sending with retry logic

```prisma
model EmailOutbox {
  status      EmailStatus  // PENDING | PROCESSING | SENT | FAILED
  attempts    Int
  nextRetryAt DateTime?
}
```

### L. Lazy Expiration

**Pattern**: Update status on access, not via cron

```typescript
if (request.expiresAt < now && request.status === 'PENDING') {
  await prisma.rescheduleRequest.update({
    where: { id },
    data: { status: 'EXPIRED' }
  });
  throw new ForbiddenException('Request expired');
}
```

### M. Cron Jobs for Automation

```typescript
@Cron(CronExpression.EVERY_HOUR)
async expireUnpaidBookings() { /* ... */ }

@Cron(CronExpression.EVERY_HOUR)
async autoCompleteScheduledSessions() { /* ... */ }

@Cron(CronExpression.EVERY_10_MINUTES)
async sendEscrowReminders() { /* ... */ }
```

### N. Server-Side Pricing (Security)

**Anti-Tampering**: Client never sends price

```typescript
// ❌ Vulnerable
const booking = await create({ price: dto.price });

// ✅ Secure
const calculatedPrice = pricePerHour * durationHours;
const booking = await create({ price: calculatedPrice });
```

### O. Audit Trail

**Purpose**: Track admin actions for accountability

```prisma
model AuditLog {
  action    AuditAction  // USER_BAN, DISPUTE_RESOLVE, etc.
  actorId   String       // Admin who performed action
  targetId  String?      // Affected resource
  payload   Json?        // Additional context
}
```

### P. Feature Toggles

```prisma
model SystemSettings {
  packagesEnabled Boolean @default(true)
  demosEnabled    Boolean @default(true)
}
```

### Q. Snapshot Pattern (Immutability)

**Pattern**: Store historical data for audit/consistency

```typescript
// Booking cancellation
cancellationPolicySnapshot: booking.teacherProfile.cancellationPolicy

// Package purchase
originalPricePerSession: teacherSubject.pricePerHour
discountedPricePerSession: calculated at purchase time

// Withdrawal request
bankSnapshot: JSON.stringify(teacher.bankInfo)
```

### R. Rate Limiting

```typescript
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
// Max 5 login attempts per minute
```

---

## 10. Project Maturity Indicators

### ✅ Implemented Best Practices

- Monorepo with shared code
- TypeScript throughout (type safety)
- Database migrations (Prisma)
- Transaction safety (atomic operations)
- Idempotency keys (duplicate prevention)
- Money normalization (no float errors)
- Timezone handling (UTC storage)
- Audit logging (accountability)
- Rate limiting (abuse prevention)
- Server-side validation (security)
- Escrow payments (trust & safety)
- Notification deduplication
- Readable IDs (user-friendly)
- Snapshot pattern (data immutability)
- Conditional updates (race protection)

### ⚠️ Areas for Potential Enhancement

- **No JWT refresh tokens** - Sessions expire permanently, no automatic renewal
- **No frontend error boundaries** - Uncaught errors may crash entire app
- **Limited test coverage** - Some service tests exist, but no comprehensive E2E testing
- **No CI/CD pipeline** - Only Docker Compose for local dev, no automated deployment
- **Email single point of failure** - Reliance on SendGrid only
- **No real-time features** - No WebSockets for live booking updates or notifications
- **No internationalization (i18n)** - Hardcoded Arabic/English strings
- **No rate limiting on frontend** - Only backend throttling
- **No optimistic UI updates** - All operations wait for server response
- **Limited logging/monitoring** - No structured logging or APM integration

---

## Summary

**Sidra-Ai** is a **comprehensive education marketplace** with robust financial transactions, booking management, and multi-role dashboards. The architecture demonstrates professional patterns including:

- Escrow-based payments with dispute resolution
- Timezone-aware scheduling with availability management
- Package systems with anti-abuse mechanisms
- Teacher onboarding with KYC verification
- Admin tools for platform management
- Well-structured monorepo with code sharing

The platform is production-ready for MVP launch, with clear pathways for scaling and enhancement. The codebase shows strong fundamentals in transaction safety, data integrity, and security practices.

---

**End of Analysis**
