# Feature Specification: Email OTP Verification

**Status:** Planned
**Author:** Development Team
**Created:** 2026-01-11
**Last Updated:** 2026-01-11
**Version:** 1.1

---

> **Changelog v1.1:**
> - Fixed email enumeration vulnerability (unified responses)
> - Added HMAC-SHA256 with server secret for OTP hashing
> - Added database transaction requirement for verification
> - Standardized error response format with error codes
> - Upgraded cleanup cron from P2 to P0
> - Added race condition handling
> - Added existing user migration plan

---

## Executive Summary

Implement email-based One-Time Password (OTP) verification for user registration and sensitive account actions. This feature uses the existing Resend email infrastructure to send 6-digit verification codes, improving security while maintaining a smooth user experience.

---

## Table of Contents

1. [Feature Specification](#1-feature-specification)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Model](#3-data-model)
4. [API Endpoints](#4-api-endpoints)
5. [UX & Product Decisions](#5-ux--product-decisions)
6. [Security Considerations](#6-security-considerations)
7. [Transaction & Consistency](#7-transaction--consistency)
8. [Risk Analysis](#8-risk-analysis)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Feature Specification

### Feature Goal

Enable secure email verification for new user registrations using OTP codes sent via Resend, ensuring valid email addresses and preventing spam registrations.

### Business Context

**Current Problem:**
- Users can register with any email without verification
- No proof that users own the email addresses they provide
- Potential for spam/fake accounts
- Password reset relies on unverified emails

**Goal:**
- Verify email ownership during registration
- Use existing Resend infrastructure (no new costs)
- Simple 6-digit OTP flow familiar to users
- Secure with rate limiting and expiration

### User Stories

#### New User (Parent/Student)
- As a new user, I want to verify my email during registration so my account is secure
- As a new user, I want to receive the OTP quickly (within seconds)
- As a new user, I want to resend the OTP if I didn't receive it
- As a new user, I want clear error messages if my OTP is wrong or expired

#### Teacher
- As a teacher registering, I want to verify my email to prove my identity
- As a teacher, I want the verification process to be quick so I can complete onboarding

#### Admin
- As an admin, I want to see which users have verified emails
- As an admin, I want to view OTP request logs for debugging
- As an admin, I want protection against OTP abuse/spam

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Generate 6-digit numeric OTP on registration request | P0 |
| FR-2 | Send OTP via Resend email to provided address | P0 |
| FR-3 | OTP expires after 10 minutes | P0 |
| FR-4 | Maximum 5 OTP verification attempts per code | P0 |
| FR-5 | Allow OTP resend with 60-second cooldown | P0 |
| FR-6 | Mark user as email verified after successful OTP | P0 |
| FR-7 | **Clean up expired OTPs automatically (cron job)** | **P0** |
| FR-8 | **Prevent email enumeration (unified responses)** | **P0** |
| FR-9 | **Wrap verification in database transaction** | **P0** |
| FR-10 | Rate limit: max 5 OTP requests per email per hour | P1 |
| FR-11 | Rate limit: max 10 OTP requests per IP per hour (soft limit) | P1 |
| FR-12 | OTP verification for password reset flow | P2 |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | OTP email delivery time | < 10 seconds |
| NFR-2 | OTP verification API response time | < 200ms |
| NFR-3 | System handles concurrent OTP requests | 100/minute |
| NFR-4 | OTP storage secure (HMAC-SHA256 with server secret) | Required |
| NFR-5 | Constant-time OTP comparison | Required |

### Out of Scope (Phase 1)

- SMS OTP (requires paid SMS provider)
- WhatsApp OTP
- Magic link authentication
- Biometric verification
- OTP for login (only registration for now)

---

## 2. Technical Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION WITH OTP FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Request Registration
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ User enters  │────▶│ POST /auth/      │────▶│ Check if email      │
│ email + data │     │ register/request │     │ already registered  │
└──────────────┘     └──────────────────┘     └─────────────────────┘
                                                        │
                                    ┌───────────────────┴───────────────────┐
                                    │                                       │
                                    ▼                                       ▼
                           ┌─────────────────┐                    ┌─────────────────┐
                           │ Email NOT       │                    │ Email EXISTS    │
                           │ registered      │                    │ (already user)  │
                           └─────────────────┘                    └─────────────────┘
                                    │                                       │
                                    ▼                                       ▼
                           ┌─────────────────┐                    ┌─────────────────┐
                           │ Generate OTP    │                    │ Send different  │
                           │ Create pending  │                    │ email: "Someone │
                           │ Send OTP email  │                    │ tried to use    │
                           └─────────────────┘                    │ your email..."  │
                                    │                             └─────────────────┘
                                    │                                       │
                                    └───────────────────┬───────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ SAME SUCCESS        │
                                               │ RESPONSE (200)      │
                                               │ (prevents email     │
                                               │  enumeration)       │
                                               └─────────────────────┘

Step 2: Verify OTP (Transactional)
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ User enters  │────▶│ POST /auth/      │────▶│ BEGIN TRANSACTION   │
│ 6-digit OTP  │     │ register/verify  │     │                     │
└──────────────┘     └──────────────────┘     └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ SELECT FOR UPDATE   │
                                               │ PendingRegistration │
                                               └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Validate:           │
                                               │ - Not expired       │
                                               │ - Attempts < 5      │
                                               │ - HMAC matches      │
                                               └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Create User         │
                                               │ Delete Pending      │
                                               │ COMMIT              │
                                               └─────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────────┐
                                               │ Return JWT tokens   │
                                               └─────────────────────┘
```

### Backend Service Structure

```typescript
// apps/api/src/auth/otp.service.ts

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate and send OTP for registration
   *
   * SECURITY: Returns IDENTICAL response regardless of whether email
   * is already registered (prevents email enumeration attacks)
   */
  async requestRegistrationOtp(
    email: string,
    registrationData: PendingRegistrationData,
    ipAddress: string,
  ): Promise<OtpRequestResponse> {
    // 1. Check rate limits (email + IP)
    // 2. Check if email already registered
    //    - If YES: Send "account exists" email, return success
    //    - If NO: Continue with OTP flow
    // 3. Generate 6-digit OTP
    // 4. Hash OTP with HMAC-SHA256 using server secret
    // 5. Store with registration data (upsert - handles resend case)
    // 6. Queue OTP email via notification service
    // 7. Return SAME success response (prevents enumeration)
  }

  /**
   * Verify OTP and complete registration
   *
   * CRITICAL: Entire flow MUST be wrapped in database transaction
   * with SELECT FOR UPDATE to prevent race conditions
   */
  async verifyRegistrationOtp(
    email: string,
    otp: string,
  ): Promise<OtpVerifyResponse> {
    return this.prisma.$transaction(async (tx) => {
      // 1. SELECT FOR UPDATE PendingRegistration by email
      // 2. Check not expired (with 5-second grace period)
      // 3. Check attempts < 5
      // 4. Compare HMAC hashes using crypto.timingSafeEqual()
      // 5. If valid: create user, delete pending, return tokens
      // 6. If invalid: increment attempts, return error with errorCode
    }, {
      isolationLevel: 'Serializable', // Prevent race conditions
    });
  }

  /**
   * Resend OTP (with cooldown)
   */
  async resendOtp(email: string): Promise<OtpResendResponse> {
    // 1. Check cooldown (60 seconds since last send)
    // 2. Generate new OTP
    // 3. Update pending registration (keep old OTP valid for 30s grace)
    // 4. Send new email
    // 5. Return response with expiresAt timestamp
  }

  /**
   * Generate cryptographically secure 6-digit OTP
   */
  private generateOtp(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, '0');
  }

  /**
   * Hash OTP using HMAC-SHA256 with server secret
   *
   * Why HMAC over plain SHA-256:
   * - Prevents rainbow table attacks on 6-digit space
   * - Server secret adds additional security layer
   */
  private hashOtp(otp: string): string {
    const secret = this.configService.get('OTP_SECRET');
    return crypto.createHmac('sha256', secret).update(otp).digest('hex');
  }

  /**
   * Constant-time OTP comparison to prevent timing attacks
   */
  private verifyOtpHash(providedOtp: string, storedHash: string): boolean {
    const providedHash = this.hashOtp(providedOtp);
    return crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(storedHash)
    );
  }
}
```

### Email Templates

#### OTP Email (for new registrations)
```typescript
const otpEmailTemplate = {
  subject: 'رمز التحقق من سدرة',
  html: `
    <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #003366; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">سدرة</h1>
      </div>

      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #003366;">رمز التحقق الخاص بك</h2>

        <p style="font-size: 16px; color: #333;">
          مرحباً،<br/>
          استخدم الرمز التالي لإكمال التسجيل في سدرة:
        </p>

        <div style="background: #003366; color: white; font-size: 32px; font-weight: bold;
                    letter-spacing: 8px; padding: 20px; text-align: center; margin: 20px 0;
                    border-radius: 8px;">
          {{otp}}
        </div>

        <p style="font-size: 14px; color: #666;">
          ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط.<br/>
          🔒 لا تشارك هذا الرمز مع أي شخص.
        </p>

        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.
        </p>
      </div>

      <div style="background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        © 2026 سدرة - منصة الدروس الخصوصية
      </div>
    </div>
  `,
};
```

#### Account Exists Email (for already-registered emails)
```typescript
// SECURITY: Sent when someone tries to register with an existing email
// This prevents email enumeration by returning success while alerting the owner
const accountExistsEmailTemplate = {
  subject: 'محاولة تسجيل حساب جديد - سدرة',
  html: `
    <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #003366; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">سدرة</h1>
      </div>

      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #003366;">تنبيه أمني</h2>

        <p style="font-size: 16px; color: #333;">
          مرحباً،<br/>
          حاول شخص ما إنشاء حساب جديد باستخدام بريدك الإلكتروني.
        </p>

        <p style="font-size: 16px; color: #333;">
          إذا كان هذا أنت، يمكنك <a href="{{loginUrl}}" style="color: #003366;">تسجيل الدخول هنا</a>
          أو <a href="{{resetPasswordUrl}}" style="color: #003366;">إعادة تعيين كلمة المرور</a>.
        </p>

        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          إذا لم تكن أنت من طلب هذا، يمكنك تجاهل هذه الرسالة. حسابك آمن.
        </p>
      </div>

      <div style="background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        © 2026 سدرة - منصة الدروس الخصوصية
      </div>
    </div>
  `,
};
```

---

## 3. Data Model

### Schema Changes

```prisma
// packages/database/prisma/schema.prisma

// New model for pending registrations with OTP
model PendingRegistration {
  id              String    @id @default(cuid())
  email           String    @unique
  otpHash         String    // HMAC-SHA256 hashed OTP with server secret

  // Store registration data temporarily
  firstName       String
  lastName        String
  passwordHash    String    // bcrypt hashed, same as User model
  role            UserRole
  phone           String?

  // OTP tracking
  attempts        Int       @default(0)
  lastSentAt      DateTime  @default(now())
  expiresAt       DateTime

  // Previous OTP (for resend grace period)
  previousOtpHash String?
  previousExpiresAt DateTime?

  // Rate limiting & security
  ipAddress       String
  sendCount       Int       @default(1)  // How many times OTP was sent

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([expiresAt])
  @@index([createdAt])  // For cleanup cron
}

// Add to existing User model
model User {
  // ... existing fields ...

  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
}

// OTP rate limiting tracking (consider Redis alternative for production scale)
model OtpRateLimit {
  id          String   @id @default(cuid())
  identifier  String   // email or IP address
  type        String   // 'email' or 'ip'
  count       Int      @default(1)
  windowStart DateTime @default(now())

  @@unique([identifier, type])
  @@index([windowStart])  // For cleanup
}
```

### Data Flow

```
Registration Request (Unified Response):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  1. User submits: email, password, name, role                              │
│                           │                                                 │
│                           ▼                                                 │
│  2. Check if email exists in User table                                    │
│                           │                                                 │
│           ┌───────────────┴───────────────┐                                │
│           │                               │                                 │
│           ▼                               ▼                                 │
│  ┌─────────────────┐           ┌─────────────────────┐                     │
│  │ Email NOT       │           │ Email EXISTS        │                     │
│  │ registered      │           │ (user account)      │                     │
│  └─────────────────┘           └─────────────────────┘                     │
│           │                               │                                 │
│           ▼                               ▼                                 │
│  ┌─────────────────┐           ┌─────────────────────┐                     │
│  │ Upsert Pending: │           │ Send "account       │                     │
│  │ - otpHash       │           │ exists" email       │                     │
│  │ - passwordHash  │           │ (no OTP, just       │                     │
│  │ - expiresAt     │           │  security alert)    │                     │
│  │ - attempts: 0   │           └─────────────────────┘                     │
│  └─────────────────┘                     │                                 │
│           │                               │                                 │
│           ▼                               │                                 │
│  ┌─────────────────┐                     │                                 │
│  │ Send OTP email  │                     │                                 │
│  └─────────────────┘                     │                                 │
│           │                               │                                 │
│           └───────────────┬───────────────┘                                │
│                           │                                                 │
│                           ▼                                                 │
│  3. Return IDENTICAL success response:                                     │
│     {                                                                       │
│       "success": true,                                                      │
│       "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",               │
│       "expiresAt": "2026-01-11T12:10:00Z"                                  │
│     }                                                                       │
│                                                                             │
│  SECURITY: Attacker cannot tell if email was registered or not             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

OTP Verification (Transactional):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. User submits: email, otp                                   │
│                           │                                     │
│                           ▼                                     │
│  2. BEGIN TRANSACTION (Serializable isolation)                 │
│                           │                                     │
│                           ▼                                     │
│  3. SELECT FOR UPDATE PendingRegistration WHERE email = ?      │
│                           │                                     │
│                           ▼                                     │
│  4. Validate:                                                   │
│     - expiresAt > NOW() - 5 seconds (grace period)             │
│     - attempts < 5                                             │
│     - HMAC matches (current OR previous hash within grace)     │
│                           │                                     │
│                           ▼                                     │
│  5. If valid:                                                   │
│     - INSERT User with emailVerified: true                     │
│     - DELETE PendingRegistration                               │
│     - COMMIT                                                    │
│     - Return JWT tokens                                        │
│                                                                 │
│  6. If invalid:                                                 │
│     - UPDATE attempts = attempts + 1                           │
│     - COMMIT                                                    │
│     - Return error with errorCode                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Existing User Migration

When deploying this feature, run a migration to set `emailVerified` for existing users:

```sql
-- Migration: Set emailVerified for existing users
UPDATE "User"
SET "emailVerified" = true,
    "emailVerifiedAt" = "createdAt"
WHERE "emailVerified" IS NULL OR "emailVerified" = false;
```

**Rationale:** Existing users registered before OTP was implemented should not be forced to re-verify.

---

## 4. API Endpoints

### Standardized Error Response Format

All endpoints use consistent error response structure:

```typescript
interface ErrorResponse {
  statusCode: number;
  errorCode: string;        // Machine-readable error type
  message: string;          // User-friendly Arabic message
  requestId?: string;       // For debugging/support
  meta?: {
    retryAfter?: number;    // Seconds until retry allowed
    expiresAt?: string;     // ISO timestamp
  };
}

// Error codes
enum OtpErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  OTP_INVALID = 'OTP_INVALID',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  PENDING_NOT_FOUND = 'PENDING_NOT_FOUND',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
}
```

### Request Registration OTP

```typescript
// POST /auth/register/request
// Public endpoint - no auth required

// Request Body
interface RequestRegistrationDto {
  email: string;          // Required, valid email format
  password: string;       // Required, min 8 chars
  firstName: string;      // Required
  lastName: string;       // Required
  role: 'PARENT' | 'STUDENT' | 'TEACHER';  // Required
  phone?: string;         // Optional
}

// Success Response (200) - ALWAYS returned regardless of email status
// SECURITY: Prevents email enumeration
{
  "success": true,
  "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
  "expiresAt": "2026-01-11T12:10:00.000Z"  // ISO timestamp for accuracy
}

// Error Responses
// 400 - Validation error
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "البريد الإلكتروني غير صالح",
  "requestId": "req_abc123"
}

// 429 - Rate limited
{
  "statusCode": 429,
  "errorCode": "RATE_LIMITED",
  "message": "تم تجاوز الحد الأقصى للطلبات. حاول بعد ساعة.",
  "requestId": "req_abc123",
  "meta": {
    "retryAfter": 3600
  }
}
```

### Verify OTP

```typescript
// POST /auth/register/verify
// Public endpoint - no auth required

// Request Body
interface VerifyOtpDto {
  email: string;    // Required
  otp: string;      // Required, 6 digits
}

// Success Response (201) - User created
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "PARENT",
    "emailVerified": true
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}

// Error Responses
// 400 - Invalid OTP (SECURITY: No attemptsRemaining to prevent info leak)
{
  "statusCode": 400,
  "errorCode": "OTP_INVALID",
  "message": "رمز التحقق غير صحيح",
  "requestId": "req_abc123"
}

// 400 - OTP expired
{
  "statusCode": 400,
  "errorCode": "OTP_EXPIRED",
  "message": "انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.",
  "requestId": "req_abc123"
}

// 400 - Too many attempts
{
  "statusCode": 400,
  "errorCode": "OTP_MAX_ATTEMPTS",
  "message": "تم تجاوز الحد الأقصى للمحاولات. اطلب رمزاً جديداً.",
  "requestId": "req_abc123"
}

// 404 - No pending registration
{
  "statusCode": 404,
  "errorCode": "PENDING_NOT_FOUND",
  "message": "لم يتم العثور على طلب تسجيل. ابدأ التسجيل من جديد.",
  "requestId": "req_abc123"
}
```

### Resend OTP

```typescript
// POST /auth/register/resend
// Public endpoint - no auth required

// Request Body
interface ResendOtpDto {
  email: string;    // Required
}

// Success Response (200)
{
  "success": true,
  "message": "تم إرسال رمز تحقق جديد",
  "expiresAt": "2026-01-11T12:10:00.000Z",
  "meta": {
    "nextResendAt": "2026-01-11T12:01:00.000Z"  // When resend becomes available
  }
}

// Error Responses
// 429 - Cooldown not elapsed
{
  "statusCode": 429,
  "errorCode": "COOLDOWN_ACTIVE",
  "message": "يرجى الانتظار قبل طلب رمز جديد",
  "requestId": "req_abc123",
  "meta": {
    "retryAfter": 45
  }
}

// 429 - Hourly limit reached
{
  "statusCode": 429,
  "errorCode": "RATE_LIMITED",
  "message": "تم تجاوز الحد الأقصى للطلبات. حاول بعد ساعة.",
  "requestId": "req_abc123",
  "meta": {
    "retryAfter": 3600
  }
}

// 404 - No pending registration
{
  "statusCode": 404,
  "errorCode": "PENDING_NOT_FOUND",
  "message": "لم يتم العثور على طلب تسجيل. ابدأ التسجيل من جديد.",
  "requestId": "req_abc123"
}
```

---

## 5. UX & Product Decisions

### Registration Flow UI

```
Step 1: Registration Form
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    إنشاء حساب جديد                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ البريد الإلكتروني *                                      │   │
│  │ [user@example.com                               ]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ كلمة المرور *                                            │   │
│  │ [••••••••                                       ]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ الاسم الأول *         │  │ اسم العائلة *         │            │
│  │ [أحمد            ]   │  │ [محمد            ]   │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          [ 🚀 إرسال رمز التحقق ]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


Step 2: OTP Verification
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    التحقق من البريد الإلكتروني                  │
│                                                                 │
│            📧 تم إرسال رمز التحقق إلى                          │
│               user@example.com                                  │
│                                                                 │
│         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                   │
│         │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │                   │
│         └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                   │
│                                                                 │
│                   ⏱️ صالح لمدة 9:45                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              [ ✓ تأكيد الرمز ]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│         لم تستلم الرمز؟ [ إعادة الإرسال ] (متاح بعد 60 ث)      │
│                                                                 │
│         [ ← تغيير البريد الإلكتروني ]                          │
│                                                                 │
│   💡 تحقق من مجلد الرسائل غير المرغوب فيها (Spam)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Experience Requirements

| Scenario | Behavior | Error Code to Check |
|----------|----------|---------------------|
| OTP input | Auto-focus next digit, auto-submit on 6th digit | - |
| Countdown timer | Show remaining time based on `expiresAt` | - |
| Resend cooldown | Disable button, show countdown based on `meta.nextResendAt` | - |
| Wrong OTP | Shake animation, show generic error | `OTP_INVALID` |
| Expired OTP | Clear inputs, show resend prompt | `OTP_EXPIRED` |
| Max attempts | Show error, auto-trigger resend flow | `OTP_MAX_ATTEMPTS` |
| Success | Auto-redirect to dashboard | - |
| Rate limited | Show wait time from `meta.retryAfter` | `RATE_LIMITED` |

### Mobile Considerations

- OTP input uses `inputmode="numeric"` for mobile keyboard
- Large touch targets for digit inputs
- Clear visual feedback on input
- Pattern attribute for potential auto-fill: `pattern="[0-9]{6}"`
- Auto-read OTP from SMS (if user pastes from email)

---

## 6. Security Considerations

### OTP Security

| Measure | Implementation |
|---------|----------------|
| OTP Generation | Cryptographically secure random (`crypto.randomBytes`) |
| OTP Storage | **HMAC-SHA256 with server secret** (not plain SHA-256) |
| OTP Transmission | HTTPS only |
| OTP Expiration | 10 minutes max (with 5-second grace period) |
| Attempt Limiting | 5 attempts per OTP |
| Rate Limiting | 5 requests/email/hour, 10 requests/IP/hour (soft) |
| Comparison | Constant-time using `crypto.timingSafeEqual()` |

### Why HMAC-SHA256 with Server Secret?

Plain SHA-256 of a 6-digit OTP can be precomputed (only 1 million possibilities). HMAC with server secret:
- Prevents rainbow table attacks
- Makes database dump less dangerous
- Adds defense-in-depth

```typescript
// Environment variable required
OTP_SECRET=<random-32-byte-hex-string>
```

### Email Enumeration Prevention

**Critical security feature:** The `/register/request` endpoint returns **identical success responses** regardless of whether an email is already registered.

| Scenario | What Happens | Response to User |
|----------|--------------|------------------|
| New email | Create pending, send OTP email | 200 Success |
| Existing email | Send "security alert" email | 200 Success (identical) |

This prevents attackers from discovering which emails have accounts.

### Rate Limiting Strategy

```typescript
const RATE_LIMITS = {
  // Per email address (hard limit)
  email: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Per IP address (soft limit - log but allow with exponential backoff)
  ip: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    softLimit: true,  // Don't block, just increase delays
  },
  // Resend cooldown
  resend: {
    cooldownMs: 60 * 1000, // 60 seconds
  },
};
```

### Attack Mitigation

| Attack | Mitigation |
|--------|------------|
| Brute force OTP | 5 attempts limit + 10 min expiry = 5 guesses max (0.0005% success) |
| Email enumeration | **Unified responses** - same response for registered/unregistered |
| Spam/abuse | Rate limiting per email and IP |
| Replay attack | OTP single-use (deleted after verification) |
| Timing attack | **Constant-time comparison** with `crypto.timingSafeEqual()` |
| Rainbow table | **HMAC with server secret** prevents precomputation |

---

## 7. Transaction & Consistency

### Race Condition Handling

#### Scenario 1: Double Submit (User clicks verify twice)

**Problem:** Two requests with same valid OTP arrive simultaneously.

**Solution:**
```typescript
// Use SELECT FOR UPDATE with Serializable isolation
await prisma.$transaction(async (tx) => {
  const pending = await tx.pendingRegistration.findUnique({
    where: { email },
    // This locks the row until transaction completes
  });

  // ... validation ...

  await tx.user.create({ ... });
  await tx.pendingRegistration.delete({ where: { email } });
}, {
  isolationLevel: 'Serializable',
});
```

#### Scenario 2: Concurrent Resend + Verify

**Problem:** User requests resend while entering old OTP.

**Solution:** Keep previous OTP valid for 30-second grace period:
```prisma
model PendingRegistration {
  otpHash           String    // Current OTP
  previousOtpHash   String?   // Previous OTP (valid for 30s after resend)
  previousExpiresAt DateTime? // When previous OTP becomes invalid
}
```

Verification accepts EITHER current or previous (if within grace period).

#### Scenario 3: Verify at Exact Expiry Time

**Problem:** OTP expires at T+10:00.000, user submits at T+10:00.001.

**Solution:** Add 5-second grace period to expiry check:
```typescript
const isExpired = pending.expiresAt < new Date(Date.now() - 5000);
```

### Database Transaction Requirements

**The verify endpoint MUST be transactional:**

```
BEGIN TRANSACTION (Serializable)
├── SELECT FOR UPDATE PendingRegistration
├── Validate OTP (expiry, attempts, hash)
├── If valid:
│   ├── INSERT User
│   └── DELETE PendingRegistration
└── COMMIT
```

**If any step fails, entire operation rolls back.**

---

## 8. Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Resend API downtime | Low | High | Queue emails, retry mechanism via EmailOutboxWorker |
| OTP emails in spam | Medium | Medium | Proper SPF/DKIM, add "check spam" UI hint |
| Race condition on verification | Low | High | **Database transaction with row locking** |
| Clock skew affecting expiry | Low | Low | Use database time (`NOW()`), add grace period |
| OTP secret leaked | Very Low | High | Use secret management, rotate periodically |

### User Experience Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users don't check email | Medium | Medium | Clear instructions, spam folder hint |
| OTP delayed delivery | Low | Medium | 10 min expiry gives buffer |
| Users confused by flow | Low | Medium | Clear UI, progress indicators |
| User enters wrong email | Medium | Low | "Change email" option in OTP screen |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Increased registration abandonment | Medium | Medium | Fast email delivery, easy resend |
| Support load increase | Low | Low | Good error messages, FAQ, error codes for debugging |

---

## 9. Implementation Checklist

### Phase 1: Core Implementation (P0)

#### Backend
- [ ] Add `OTP_SECRET` environment variable to staging/production
- [ ] Create `PendingRegistration` Prisma model
- [ ] Add `emailVerified`, `emailVerifiedAt` fields to User model
- [ ] Create migration for existing users (`emailVerified = true`)
- [ ] Create `OtpService` with HMAC-SHA256 hashing
- [ ] Implement constant-time OTP comparison
- [ ] Implement `POST /auth/register/request` with unified responses
- [ ] Implement `POST /auth/register/verify` with database transaction
- [ ] Implement `POST /auth/register/resend` with cooldown
- [ ] Create OTP email template (Arabic)
- [ ] Create "account exists" email template (Arabic)
- [ ] **Add OTP cleanup cron job (runs every 15 minutes)**
- [ ] Add rate limit cleanup cron job

#### Frontend
- [ ] Create OTP input component (6-digit)
- [ ] Update registration flow to two-step process
- [ ] Add countdown timer component (use `expiresAt` from API)
- [ ] Implement resend button with cooldown
- [ ] Add loading states and error handling by `errorCode`
- [ ] Add "check spam folder" hint
- [ ] Mobile-optimize OTP input

#### Testing
- [ ] Unit tests for OtpService (hash, verify, timing-safe compare)
- [ ] Unit tests for rate limiting
- [ ] Integration tests for full registration flow
- [ ] Test expired OTP handling (including grace period)
- [ ] Test max attempts handling
- [ ] Test resend cooldown
- [ ] **Test race condition handling (concurrent verify)**
- [ ] Test email enumeration prevention

#### Security
- [ ] Verify OTP_SECRET is set in all environments
- [ ] Verify constant-time comparison is used
- [ ] Verify unified responses for email enumeration
- [ ] Verify transaction isolation level
- [ ] Security review before production

#### Deployment
- [ ] Add database migrations
- [ ] Add OTP_SECRET to environment variables
- [ ] Configure rate limit values for production
- [ ] Set up monitoring for OTP failure rates
- [ ] Set up alerting for high OTP request rates (abuse detection)

### Phase 2: Enhancements (P1)

- [ ] Move rate limiting to Redis for better performance
- [ ] Add exponential backoff for IP rate limiting
- [ ] Add admin view of OTP requests (debugging)
- [ ] Analytics: registration completion rate by step
- [ ] Add request ID to all responses for support debugging

### Phase 3: Future (P2)

- [ ] OTP for password reset flow
- [ ] OTP for email change
- [ ] A/B test OTP length (6 vs 4 digits)
- [ ] Consider magic link as alternative

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| Resend emails | Free tier: 3,000/month |
| Database storage | Negligible (small records, auto-cleanup) |
| Development time | ~3-4 days (increased due to security requirements) |

**Total additional cost: $0** (within Resend free tier)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| OTP delivery rate | > 99% | Resend dashboard |
| OTP delivery time | < 10 seconds | Resend logs |
| Registration completion rate | > 80% | Analytics |
| OTP verification success rate | > 95% | Backend logs |
| Support tickets (OTP issues) | < 5/month | Support system |
| Email enumeration attempts blocked | 100% | No different response codes |

---

## Environment Variables Required

```bash
# Required for OTP hashing
OTP_SECRET=<random-32-byte-hex-string>

# Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

*This specification is ready for implementation. Questions should be directed to the Development Lead.*

**Reviewed:** ✅ Security Review Complete (v1.1)
