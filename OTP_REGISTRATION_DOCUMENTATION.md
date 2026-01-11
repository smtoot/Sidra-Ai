# OTP Registration System - Documentation

## Overview

The OTP (One-Time Password) registration system adds email verification to the user registration process. Instead of creating accounts immediately, users must verify their email address with a 6-digit code sent via email.

**Status**: ✅ Feature Complete - Ready for Testing

**Branch**: `feature/otp-authentication`

---

## Architecture

### Flow Diagram

```
User Registration Flow:
1. User fills form → Request OTP (POST /auth/register/request)
2. Backend sends OTP email
3. User enters OTP → Verify (POST /auth/register/verify)
4. Backend creates account → Returns JWT tokens
5. User is logged in and redirected
```

---

## Backend Implementation

### Database Schema

**Table**: `pending_registrations`
- Stores temporary registration data until email verification
- Fields: email, phoneNumber, firstName, lastName, passwordHash, role, otpHash, etc.
- Indexes on email, otpExpiresAt, createdAt

**Table**: `otp_rate_limits`
- Prevents abuse with email and IP-based rate limiting
- Tracks attempts per email/IP within rolling time windows

**Migration**: `20260111000000_add_email_otp_verification/migration.sql`

### API Endpoints

#### 1. Request Registration (Send OTP)
```
POST /auth/register/request
Body: RegisterRequestDto {
  email: string
  phoneNumber: string
  password: string
  role: 'PARENT' | 'STUDENT' | 'TEACHER'
  firstName: string
  lastName: string
}
Response: {
  message: "OTP sent to email"
  email: string
}
```

**Rate Limits**:
- Controller: 10 requests/minute
- Service: 5 requests/hour per email
- Service: 10 requests/hour per IP

#### 2. Verify Registration (Verify OTP)
```
POST /auth/register/verify
Body: VerifyRegistrationDto {
  email: string
  otp: string (6 digits)
}
Response: {
  access_token: string
  refresh_token: string
  user: UserObject
}
```

**Rate Limits**:
- Controller: 10 requests/minute
- Max 3 OTP attempts per pending registration

#### 3. Resend OTP
```
POST /auth/register/resend
Body: ResendOtpDto {
  email: string
}
Response: {
  message: "New OTP sent"
}
```

**Rate Limits**:
- Controller: 5 requests/minute
- Service: 5 requests/hour per email

### Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (cost factor 10)
   - Never stored in plain text

2. **OTP Security**
   - Generated with `crypto.randomInt()` (cryptographic randomness)
   - Hashed with HMAC-SHA256 before storage
   - Constant-time comparison prevents timing attacks
   - 10-minute expiry with 5-second grace period
   - 30-second grace for previous OTP (prevents race conditions)

3. **Rate Limiting**
   - Email-based limits (5/hour)
   - IP-based limits (10/hour)
   - Attempt-based limits (3 failures)

4. **Anti-Abuse**
   - Duplicate email detection
   - Rate limit windows reset after 1 hour
   - Automatic cleanup of expired registrations

### Services

**File**: `apps/api/src/auth/otp.service.ts`
- `generateOtp()` - Creates 6-digit OTP
- `hashOtp()` - HMAC-SHA256 hashing
- `verifyOtp()` - Constant-time verification
- `createRateLimit()` - Track attempts
- `checkRateLimit()` - Enforce limits

**File**: `apps/api/src/auth/auth.service.ts`
- `requestRegistration()` - Create pending registration, send OTP
- `verifyRegistration()` - Verify OTP, create user, return tokens
- `resendOtp()` - Generate new OTP, send email

**File**: `apps/api/src/auth/registration-cleanup.worker.ts`
- Runs every hour
- Deletes expired pending registrations (>24 hours old)
- Cleans up old rate limit records

### Email Templates

**File**: `apps/api/src/emails/templates/RegistrationOtp.tsx`
- Beautiful React Email template
- Shows 6-digit OTP prominently
- Includes expiry time (10 minutes)
- Arabic/English bilingual
- Sidra branding

**File**: `apps/api/src/emails/templates/AccountExists.tsx`
- Sent when user tries to register with existing email
- Provides login link
- Security-focused messaging

---

## Frontend Implementation

### Registration Page

**File**: `apps/web/src/app/register/page.tsx`

**Two-Step Flow**:

#### Step 1: Details Form
- Role selection (Parent/Student/Teacher)
- Email input (with Mail icon)
- Password input (with Lock icon, min 8 chars)
- First name + Last name (with User icon)
- Phone number with country code selector (+249 Sudan default)
- Submit button: "إرسال رمز التحقق"

#### Step 2: OTP Verification
- Header shows email address
- Large centered OTP input (monospaced, 6 digits)
- Auto-focus for better UX
- Submit button: "تأكيد وإنشاء الحساب"
- Resend button with 60-second countdown
- Back button to edit details

**Features**:
- Real-time validation
- Error/success messages with icons
- Loading states
- Responsive design
- Dark mode support
- RTL (Arabic) layout

### API Client

**File**: `apps/web/src/lib/api/auth.ts`

```typescript
authApi.requestRegistration(dto: RegisterRequestDto)
authApi.verifyRegistration(dto: VerifyRegistrationDto)
authApi.resendOtp(dto: ResendOtpDto)
```

All functions properly typed with DTOs from `@sidra/shared`.

---

## Environment Variables

**Required** (Add to `.env` files):

```bash
# OTP Secret for HMAC hashing (CRITICAL - use strong random string)
OTP_SECRET="<generate-with-command-below>"

# Generate secure secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example**:
```bash
OTP_SECRET="K8vN2mP9xR4wT7yZ3bF6hJ1nL5qS8uW0cE4gI7kM2pA9rD1fG3hJ6lN8qT0vX2zA="
```

⚠️ **NEVER use default/weak secrets in production!**

---

## Testing Checklist

### Backend Tests

- [ ] Request registration with valid data
- [ ] Request registration with existing email
- [ ] Verify OTP with correct code
- [ ] Verify OTP with wrong code
- [ ] Verify OTP after expiry (10+ minutes)
- [ ] Resend OTP successfully
- [ ] Rate limiting works (5/hour email limit)
- [ ] Rate limiting works (10/hour IP limit)
- [ ] Max 3 attempts per OTP
- [ ] Cleanup worker removes old pending registrations
- [ ] Email templates render correctly
- [ ] HMAC verification is constant-time (security)

### Frontend Tests

- [ ] Registration form validation
- [ ] OTP request succeeds
- [ ] OTP verification succeeds
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Resend countdown works
- [ ] Back button preserves form data
- [ ] Role-based redirect after registration
- [ ] Analytics tracking for teachers
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] RTL layout correct

### Integration Tests

- [ ] Full registration flow (Parent)
- [ ] Full registration flow (Student)
- [ ] Full registration flow (Teacher)
- [ ] Email delivery in production
- [ ] Rate limiting across API and database
- [ ] Cleanup worker runs automatically

---

## Deployment Steps

### 1. Database Migration

Run on VPS:
```bash
cd /home/sidra/Sidra-Ai
docker compose --env-file .env.production -f docker-compose.production.yml run --rm --entrypoint="" api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'
```

This creates:
- `pending_registrations` table
- `otp_rate_limits` table
- Marks existing users as email verified

### 2. Environment Variables

Add to VPS `.env.production`:
```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
OTP_SECRET="<YOUR_SECURE_RANDOM_STRING_HERE>"
```

### 3. Deploy Code

```bash
# On local machine
git push origin feature/otp-authentication

# On VPS
cd /home/sidra/Sidra-Ai
git pull origin feature/otp-authentication
docker compose --env-file .env.production -f docker-compose.production.yml build --no-cache web api
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

### 4. Verify Deployment

```bash
# Check containers are healthy
docker ps

# Check API logs
docker logs sidra_api --tail 50

# Check Web logs
docker logs sidra_web --tail 50

# Test registration endpoint
curl -X POST https://api.sidra.sd/auth/register/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"+249912345678","password":"test1234","role":"PARENT","firstName":"Test","lastName":"User"}'
```

---

## Monitoring

### Key Metrics

1. **Registration Funnel**:
   - OTP requests per hour
   - OTP verification success rate
   - Time between request and verification
   - Drop-off rate (requested but never verified)

2. **Email Delivery**:
   - Email send success rate
   - Average delivery time
   - Bounce rate

3. **Rate Limiting**:
   - Number of rate-limited requests
   - Most common violators (IPs/emails)

4. **Database**:
   - Pending registrations count
   - Average pending time
   - Cleanup worker effectiveness

### Logs to Monitor

```bash
# OTP generation
tail -f /var/log/api.log | grep "OTP generated"

# OTP verification
tail -f /var/log/api.log | grep "OTP verified"

# Rate limiting
tail -f /var/log/api.log | grep "Rate limit"

# Email sending
tail -f /var/log/api.log | grep "Email sent"
```

---

## Troubleshooting

### "OTP_SECRET environment variable is not set"

**Cause**: Missing OTP_SECRET in `.env` file

**Fix**:
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env.production
echo 'OTP_SECRET="<generated-value>"' >> .env.production

# Restart containers
docker compose --env-file .env.production -f docker-compose.production.yml restart api
```

### "Email not received"

**Causes**:
1. Email service (Resend) not configured
2. Email in spam folder
3. Invalid email address
4. Rate limiting

**Debug**:
```bash
# Check API logs for email sending
docker logs sidra_api | grep "email"

# Check Resend dashboard for delivery status
# https://resend.com/emails
```

### "OTP invalid or expired"

**Causes**:
1. User entered wrong OTP
2. OTP expired (>10 minutes)
3. More than 3 attempts
4. Clock skew between servers

**Debug**:
```sql
-- Check pending registration
SELECT * FROM pending_registrations WHERE email = 'user@example.com';

-- Check OTP expiry
SELECT email, otp_expires_at, NOW() FROM pending_registrations WHERE email = 'user@example.com';
```

### "Too many requests"

**Cause**: Rate limiting triggered

**Debug**:
```sql
-- Check rate limits for email
SELECT * FROM otp_rate_limits WHERE email = 'user@example.com';

-- Check rate limits for IP
SELECT * FROM otp_rate_limits WHERE ip_address = '1.2.3.4';

-- Reset rate limit (if needed)
DELETE FROM otp_rate_limits WHERE email = 'user@example.com';
```

---

## Future Enhancements

### Phase 2 (Optional)

1. **SMS OTP Option**
   - Allow users to choose email OR SMS
   - Integrate with Twilio/Africa's Talking
   - Useful for users without email

2. **Remember Device**
   - Skip OTP on trusted devices
   - Use device fingerprinting

3. **Social Login Integration**
   - Google Sign-In with verified email
   - Skip OTP if email already verified by Google

4. **Admin Dashboard**
   - View pending registrations
   - Manually verify users
   - View OTP statistics

5. **Email Template Customization**
   - Multiple template themes
   - A/B testing for conversion
   - Personalized messages

---

## Code Locations

### Backend
- **Controllers**: `apps/api/src/auth/auth.controller.ts` (lines 120-157)
- **Services**: `apps/api/src/auth/auth.service.ts` (OTP methods)
- **OTP Service**: `apps/api/src/auth/otp.service.ts`
- **Cleanup Worker**: `apps/api/src/auth/registration-cleanup.worker.ts`
- **Email Templates**: `apps/api/src/emails/templates/RegistrationOtp.tsx`
- **DTOs**: `packages/shared/src/auth/register-request.dto.ts`

### Frontend
- **Registration Page**: `apps/web/src/app/register/page.tsx`
- **API Client**: `apps/web/src/lib/api/auth.ts` (lines 68-79)

### Database
- **Schema**: `packages/database/prisma/schema.prisma` (lines 1233-1265)
- **Migration**: `packages/database/prisma/migrations/20260111000000_add_email_otp_verification/`

---

## Security Audit Checklist

- [x] Passwords hashed with bcrypt
- [x] OTPs hashed with HMAC-SHA256
- [x] Constant-time OTP comparison
- [x] Cryptographic random OTP generation
- [x] Rate limiting on all endpoints
- [x] SQL injection protection (Prisma)
- [x] XSS protection (React)
- [x] CSRF protection (SameSite cookies)
- [x] No OTP in logs or responses
- [x] No plaintext passwords in database
- [x] Secure session management (JWT)
- [x] Environment variables for secrets
- [x] Input validation on all fields
- [x] Email verification required
- [x] Automatic cleanup of expired data

---

## Support & Maintenance

### Regular Tasks

**Daily**:
- Monitor registration success rate
- Check email delivery metrics

**Weekly**:
- Review rate limit violations
- Clean up stuck pending registrations

**Monthly**:
- Security audit of OTP system
- Update dependencies (Prisma, bcrypt, etc.)

### Contact

For questions or issues:
- Check logs first
- Review this documentation
- Check backend error messages
- Test with curl/Postman

---

**Last Updated**: 2026-01-12
**Version**: 1.0.0
**Status**: Ready for Testing
