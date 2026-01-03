--
-- PostgreSQL database dump
--

\restrict B3g3IxRIAvb5hLWj6hSRhCEg3LzvNSnBarSflMp4WwxF2bDkwA9kJm9U1RQrcqa

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'CHANGES_REQUESTED',
    'INTERVIEW_REQUIRED',
    'INTERVIEW_SCHEDULED',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'SETTINGS_UPDATE',
    'USER_BAN',
    'USER_UNBAN',
    'USER_VERIFY',
    'USER_REJECT',
    'DISPUTE_RESOLVE',
    'DISPUTE_DISMISS',
    'PAYOUT_PROCESS',
    'BOOKING_CANCEL',
    'REFUND_PROCESS',
    'PERMISSION_OVERRIDE_UPDATE',
    'ADMIN_USER_CREATED',
    'ADMIN_USER_DEACTIVATED',
    'TICKET_CREATED',
    'TICKET_UPDATED',
    'TICKET_CLOSED',
    'TICKET_REOPENED',
    'TICKET_ASSIGNED',
    'TICKET_ESCALATED',
    'TICKET_CONVERTED_TO_DISPUTE',
    'SUPPORT_TICKET_MESSAGE_ADDED'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- Name: BeneficiaryType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BeneficiaryType" AS ENUM (
    'CHILD',
    'STUDENT'
);


ALTER TYPE public."BeneficiaryType" OWNER TO postgres;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING_TEACHER_APPROVAL',
    'WAITING_FOR_PAYMENT',
    'PAYMENT_REVIEW',
    'SCHEDULED',
    'COMPLETED',
    'REJECTED_BY_TEACHER',
    'CANCELLED_BY_PARENT',
    'CANCELLED_BY_ADMIN',
    'EXPIRED',
    'PENDING_CONFIRMATION',
    'DISPUTED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CANCELLED_BY_TEACHER'
);


ALTER TYPE public."BookingStatus" OWNER TO postgres;

--
-- Name: CancellationPolicy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CancellationPolicy" AS ENUM (
    'FLEXIBLE',
    'MODERATE',
    'STRICT'
);


ALTER TYPE public."CancellationPolicy" OWNER TO postgres;

--
-- Name: DayOfWeek; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DayOfWeek" AS ENUM (
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
);


ALTER TYPE public."DayOfWeek" OWNER TO postgres;

--
-- Name: DemoOwnerType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DemoOwnerType" AS ENUM (
    'PARENT',
    'STUDENT'
);


ALTER TYPE public."DemoOwnerType" OWNER TO postgres;

--
-- Name: DemoStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DemoStatus" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."DemoStatus" OWNER TO postgres;

--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'RESOLVED_TEACHER_WINS',
    'RESOLVED_STUDENT_WINS',
    'RESOLVED_SPLIT',
    'DISMISSED'
);


ALTER TYPE public."DisputeStatus" OWNER TO postgres;

--
-- Name: DisputeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisputeType" AS ENUM (
    'TEACHER_NO_SHOW',
    'SESSION_TOO_SHORT',
    'QUALITY_ISSUE',
    'TECHNICAL_ISSUE',
    'OTHER'
);


ALTER TYPE public."DisputeType" OWNER TO postgres;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocumentType" AS ENUM (
    'ID_CARD',
    'CERTIFICATE',
    'DEGREE',
    'OTHER'
);


ALTER TYPE public."DocumentType" OWNER TO postgres;

--
-- Name: EmailStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmailStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SENT',
    'FAILED'
);


ALTER TYPE public."EmailStatus" OWNER TO postgres;

--
-- Name: EscalationLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EscalationLevel" AS ENUM (
    'L1',
    'L2',
    'L3'
);


ALTER TYPE public."EscalationLevel" OWNER TO postgres;

--
-- Name: ExceptionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExceptionType" AS ENUM (
    'ALL_DAY',
    'PARTIAL_DAY'
);


ALTER TYPE public."ExceptionType" OWNER TO postgres;

--
-- Name: ExperienceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExperienceType" AS ENUM (
    'SCHOOL',
    'TUTORING_CENTER',
    'ONLINE_PLATFORM',
    'PRIVATE',
    'OTHER'
);


ALTER TYPE public."ExperienceType" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: IdType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IdType" AS ENUM (
    'NATIONAL_ID',
    'PASSPORT',
    'DRIVER_LICENSE',
    'RESIDENT_PERMIT'
);


ALTER TYPE public."IdType" OWNER TO postgres;

--
-- Name: KYCStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."KYCStatus" AS ENUM (
    'PENDING',
    'INFO_REQUIRED',
    'INTERVIEW_SCHEDULED',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."KYCStatus" OWNER TO postgres;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'READ',
    'UNREAD',
    'ARCHIVED'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'BOOKING_REQUEST',
    'BOOKING_APPROVED',
    'BOOKING_REJECTED',
    'BOOKING_CANCELLED',
    'PAYMENT_SUCCESS',
    'PAYMENT_RELEASED',
    'ESCROW_REMINDER',
    'DEPOSIT_APPROVED',
    'DEPOSIT_REJECTED',
    'DISPUTE_UPDATE',
    'SYSTEM_ALERT',
    'DISPUTE_RAISED',
    'URGENT',
    'ADMIN_ALERT',
    'SESSION_REMINDER',
    'ACCOUNT_UPDATE'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PackageSessionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PackageSessionType" AS ENUM (
    'AUTO_SCHEDULED',
    'FLOATING'
);


ALTER TYPE public."PackageSessionType" OWNER TO postgres;

--
-- Name: PackageStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PackageStatus" AS ENUM (
    'ACTIVE',
    'DEPLETED',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."PackageStatus" OWNER TO postgres;

--
-- Name: QualificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."QualificationStatus" AS ENUM (
    'GRADUATED',
    'IN_PROGRESS',
    'NOT_COMPLETED'
);


ALTER TYPE public."QualificationStatus" OWNER TO postgres;

--
-- Name: RedemptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RedemptionStatus" AS ENUM (
    'RESERVED',
    'RELEASED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."RedemptionStatus" OWNER TO postgres;

--
-- Name: RescheduleRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RescheduleRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'DECLINED',
    'EXPIRED'
);


ALTER TYPE public."RescheduleRequestStatus" OWNER TO postgres;

--
-- Name: SkillCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SkillCategory" AS ENUM (
    'TEACHING_METHOD',
    'TECHNOLOGY',
    'SOFT_SKILL',
    'SUBJECT_SPECIFIC'
);


ALTER TYPE public."SkillCategory" OWNER TO postgres;

--
-- Name: SkillProficiency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SkillProficiency" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT'
);


ALTER TYPE public."SkillProficiency" OWNER TO postgres;

--
-- Name: SystemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SystemType" AS ENUM (
    'NATIONAL',
    'INTERNATIONAL'
);


ALTER TYPE public."SystemType" OWNER TO postgres;

--
-- Name: TicketCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketCategory" AS ENUM (
    'ACADEMIC',
    'SESSION',
    'FINANCIAL',
    'TECHNICAL',
    'BEHAVIORAL',
    'GENERAL'
);


ALTER TYPE public."TicketCategory" OWNER TO postgres;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'CRITICAL',
    'HIGH',
    'NORMAL',
    'LOW'
);


ALTER TYPE public."TicketPriority" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'WAITING_FOR_CUSTOMER',
    'WAITING_FOR_SUPPORT',
    'RESOLVED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: TicketType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketType" AS ENUM (
    'SUPPORT',
    'DISPUTE'
);


ALTER TYPE public."TicketType" OWNER TO postgres;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID'
);


ALTER TYPE public."TransactionStatus" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'PAYMENT_LOCK',
    'PAYMENT_RELEASE',
    'REFUND',
    'CANCELLATION_COMPENSATION',
    'WITHDRAWAL_COMPLETED',
    'WITHDRAWAL_REFUNDED',
    'DEPOSIT_APPROVED',
    'PACKAGE_PURCHASE',
    'PACKAGE_RELEASE',
    'ESCROW_RELEASE'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'PARENT',
    'STUDENT',
    'TEACHER',
    'ADMIN',
    'SUPPORT',
    'SUPER_ADMIN',
    'MODERATOR',
    'CONTENT_ADMIN',
    'FINANCE'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    payload jsonb,
    "actorId" text NOT NULL,
    "targetId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action public."AuditAction" NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "dayOfWeek" public."DayOfWeek" NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isRecurring" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.availability OWNER TO postgres;

--
-- Name: availability_exceptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_exceptions (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    type public."ExceptionType" DEFAULT 'ALL_DAY'::public."ExceptionType" NOT NULL,
    "startTime" text,
    "endTime" text,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.availability_exceptions OWNER TO postgres;

--
-- Name: bank_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_info (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "bankName" text NOT NULL,
    "accountNumber" text NOT NULL,
    "accountHolderName" text NOT NULL,
    iban text,
    "swiftCode" text,
    "bankBranch" text
);


ALTER TABLE public.bank_info OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "bookedByUserId" text NOT NULL,
    "beneficiaryType" public."BeneficiaryType" NOT NULL,
    "childId" text,
    "studentUserId" text,
    "teacherId" text NOT NULL,
    "subjectId" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "meetingLink" text,
    price numeric(10,2) NOT NULL,
    "commissionRate" numeric(5,2) DEFAULT 0.18 NOT NULL,
    status public."BookingStatus" DEFAULT 'PENDING_TEACHER_APPROVAL'::public."BookingStatus" NOT NULL,
    "cancelReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "autoReleaseAt" timestamp(3) without time zone,
    "cancellationPolicySnapshot" text,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "paymentReleasedAt" timestamp(3) without time zone,
    "refundAmount" numeric(10,2),
    "refundPercent" numeric(5,2),
    "reminderSentAt" timestamp(3) without time zone,
    "studentConfirmedAt" timestamp(3) without time zone,
    "teacherCompAmount" numeric(10,2),
    "teacherCompletedAt" timestamp(3) without time zone,
    timezone text,
    "disputeReminderSentAt" timestamp(3) without time zone,
    "disputeWindowClosesAt" timestamp(3) without time zone,
    "disputeWindowOpensAt" timestamp(3) without time zone,
    "meetingLinkReminderSentAt" timestamp(3) without time zone,
    "additionalNotes" text,
    "bookingNotes" text,
    "homeworkAssigned" boolean,
    "homeworkDescription" text,
    "lastRescheduledAt" timestamp(3) without time zone,
    "maxReschedules" integer DEFAULT 2 NOT NULL,
    "nextSessionRecommendations" text,
    "originalScheduledAt" timestamp(3) without time zone,
    "packageSessionType" public."PackageSessionType",
    "paymentDeadline" timestamp(3) without time zone,
    "paymentLockedAt" timestamp(3) without time zone,
    "pendingTierId" text,
    "readableId" text,
    "rescheduleCount" integer DEFAULT 0 NOT NULL,
    "rescheduledByRole" text,
    "sessionProofUrl" text,
    "studentPerformanceNotes" text,
    "studentPerformanceRating" integer,
    "teacherPrepNotes" text,
    "teacherSummary" text,
    "topicsCovered" text,
    "sessionReminderSentAt" timestamp(3) without time zone
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: children; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.children (
    id text NOT NULL,
    "parentId" text NOT NULL,
    name text NOT NULL,
    "gradeLevel" text,
    "schoolName" text,
    "curriculumId" text
);


ALTER TABLE public.children OWNER TO postgres;

--
-- Name: curricula; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.curricula (
    id text NOT NULL,
    "nameAr" text NOT NULL,
    "nameEn" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    code text NOT NULL,
    "systemType" public."SystemType" DEFAULT 'NATIONAL'::public."SystemType" NOT NULL
);


ALTER TABLE public.curricula OWNER TO postgres;

--
-- Name: curriculum_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.curriculum_subjects (
    "curriculumId" text NOT NULL,
    "subjectId" text NOT NULL
);


ALTER TABLE public.curriculum_subjects OWNER TO postgres;

--
-- Name: demo_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demo_sessions (
    id text NOT NULL,
    "demoOwnerId" text NOT NULL,
    "demoOwnerType" public."DemoOwnerType" NOT NULL,
    "beneficiaryId" text,
    "teacherId" text NOT NULL,
    status public."DemoStatus" DEFAULT 'SCHEDULED'::public."DemoStatus" NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "cancelledAt" timestamp(3) without time zone,
    "rescheduleCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.demo_sessions OWNER TO postgres;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputes (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "raisedByUserId" text NOT NULL,
    type public."DisputeType" NOT NULL,
    description text NOT NULL,
    evidence text[],
    status public."DisputeStatus" DEFAULT 'PENDING'::public."DisputeStatus" NOT NULL,
    "resolvedByAdminId" text,
    resolution text,
    "teacherPayout" numeric(10,2),
    "studentRefund" numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "supportTicketId" text
);


ALTER TABLE public.disputes OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    type public."DocumentType" NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: educational_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.educational_stages (
    id text NOT NULL,
    "curriculumId" text NOT NULL,
    "nameAr" text NOT NULL,
    "nameEn" text NOT NULL,
    sequence integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.educational_stages OWNER TO postgres;

--
-- Name: email_outbox; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_outbox (
    id text NOT NULL,
    "to" text NOT NULL,
    subject text NOT NULL,
    "templateId" text NOT NULL,
    payload jsonb NOT NULL,
    status public."EmailStatus" DEFAULT 'PENDING'::public."EmailStatus" NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "lastAttempt" timestamp(3) without time zone,
    "nextRetryAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.email_outbox OWNER TO postgres;

--
-- Name: grade_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_levels (
    id text NOT NULL,
    "stageId" text NOT NULL,
    "nameAr" text NOT NULL,
    "nameEn" text NOT NULL,
    code text NOT NULL,
    sequence integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.grade_levels OWNER TO postgres;

--
-- Name: interview_time_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_time_slots (
    id text NOT NULL,
    "teacherProfileId" text NOT NULL,
    "proposedDateTime" timestamp(3) without time zone NOT NULL,
    "meetingLink" text NOT NULL,
    "isSelected" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interview_time_slots OWNER TO postgres;

--
-- Name: ledger_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_audit_logs (
    id text NOT NULL,
    "runAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalWallets" integer NOT NULL,
    "walletsChecked" integer NOT NULL,
    "discrepancyCount" integer DEFAULT 0 NOT NULL,
    status text NOT NULL,
    "durationMs" integer NOT NULL,
    details jsonb,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedByUserId" text,
    "resolutionNote" text
);


ALTER TABLE public.ledger_audit_logs OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" NOT NULL,
    status public."NotificationStatus" DEFAULT 'UNREAD'::public."NotificationStatus" NOT NULL,
    link text,
    metadata jsonb,
    "dedupeKey" text,
    "readAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: package_redemptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_redemptions (
    id text NOT NULL,
    "packageId" text NOT NULL,
    "bookingId" text NOT NULL,
    status public."RedemptionStatus" DEFAULT 'RESERVED'::public."RedemptionStatus" NOT NULL,
    "releasedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.package_redemptions OWNER TO postgres;

--
-- Name: package_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_tiers (
    id text NOT NULL,
    "sessionCount" integer NOT NULL,
    "discountPercent" numeric(5,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "recurringRatio" numeric(3,2) DEFAULT 0.8 NOT NULL,
    "floatingRatio" numeric(3,2) DEFAULT 0.2 NOT NULL,
    "rescheduleLimit" integer DEFAULT 2 NOT NULL,
    "durationWeeks" integer NOT NULL,
    "gracePeriodDays" integer DEFAULT 14 NOT NULL,
    "nameAr" text,
    "nameEn" text,
    "descriptionAr" text,
    "descriptionEn" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    badge text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.package_tiers OWNER TO postgres;

--
-- Name: package_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_transactions (
    id text NOT NULL,
    "idempotencyKey" text NOT NULL,
    type text NOT NULL,
    "packageId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.package_transactions OWNER TO postgres;

--
-- Name: parent_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parent_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    city text,
    country text,
    "whatsappNumber" text
);


ALTER TABLE public.parent_profiles OWNER TO postgres;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id text NOT NULL,
    "bookingId" text,
    "teacherId" text NOT NULL,
    "ratedByUserId" text NOT NULL,
    score integer NOT NULL,
    comment text,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: readable_id_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.readable_id_counters (
    id text NOT NULL,
    type text NOT NULL,
    "yearMonth" text,
    counter integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.readable_id_counters OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "replacedByToken" text,
    "deviceInfo" text
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: reschedule_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reschedule_requests (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "requestedById" text NOT NULL,
    "proposedStartTime" timestamp(3) without time zone,
    "proposedEndTime" timestamp(3) without time zone,
    reason text NOT NULL,
    status public."RescheduleRequestStatus" DEFAULT 'PENDING'::public."RescheduleRequestStatus" NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    "respondedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reschedule_requests OWNER TO postgres;

--
-- Name: saved_teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_teachers (
    id text NOT NULL,
    "userId" text NOT NULL,
    "teacherId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.saved_teachers OWNER TO postgres;

--
-- Name: student_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_packages (
    id text NOT NULL,
    "readableId" text,
    "payerId" text NOT NULL,
    "studentId" text NOT NULL,
    "teacherId" text NOT NULL,
    "subjectId" text NOT NULL,
    "tierId" text,
    "sessionCount" integer NOT NULL,
    "sessionsUsed" integer DEFAULT 0 NOT NULL,
    "originalPricePerSession" numeric(10,2) NOT NULL,
    "discountedPricePerSession" numeric(10,2) NOT NULL,
    "perSessionReleaseAmount" numeric(10,2) NOT NULL,
    "totalPaid" numeric(10,2) NOT NULL,
    "escrowRemaining" numeric(10,2) NOT NULL,
    status public."PackageStatus" DEFAULT 'ACTIVE'::public."PackageStatus" NOT NULL,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isSmartPack" boolean DEFAULT true NOT NULL,
    "recurringWeekday" text,
    "recurringTime" text,
    "recurringSessionCount" integer,
    "floatingSessionCount" integer,
    "floatingSessionsUsed" integer DEFAULT 0 NOT NULL,
    "rescheduleLimit" integer DEFAULT 2 NOT NULL,
    "firstScheduledSession" timestamp(3) without time zone,
    "lastScheduledSession" timestamp(3) without time zone,
    "gracePeriodEnds" timestamp(3) without time zone,
    "recurringPatterns" jsonb
);


ALTER TABLE public.student_packages OWNER TO postgres;

--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "gradeLevel" text,
    bio text,
    city text,
    country text,
    "whatsappNumber" text,
    "profilePhotoUrl" text,
    "schoolName" text,
    "curriculumId" text
);


ALTER TABLE public.student_profiles OWNER TO postgres;

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id text NOT NULL,
    "nameAr" text NOT NULL,
    "nameEn" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    "readableId" text NOT NULL,
    "createdByUserId" text NOT NULL,
    "assignedToId" text,
    category public."TicketCategory" NOT NULL,
    type public."TicketType" DEFAULT 'SUPPORT'::public."TicketType" NOT NULL,
    priority public."TicketPriority" DEFAULT 'NORMAL'::public."TicketPriority" NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    "linkedBookingId" text,
    "linkedTeacherId" text,
    "linkedStudentId" text,
    subject text NOT NULL,
    description text NOT NULL,
    evidence text[] DEFAULT ARRAY[]::text[],
    "escalationLevel" public."EscalationLevel" DEFAULT 'L1'::public."EscalationLevel" NOT NULL,
    "slaDeadline" timestamp(3) without time zone,
    "slaBreach" boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedByUserId" text,
    "resolutionNote" text,
    "disputeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "lastActivityAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text DEFAULT 'default'::text NOT NULL,
    "confirmationWindowHours" integer DEFAULT 48 NOT NULL,
    "autoReleaseEnabled" boolean DEFAULT true NOT NULL,
    "reminderHoursBeforeRelease" integer DEFAULT 6 NOT NULL,
    "defaultCommissionRate" double precision DEFAULT 0.18 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "disputeWindowHours" integer DEFAULT 48 NOT NULL,
    "maxPricePerHour" numeric(10,2) DEFAULT 50000 NOT NULL,
    "defaultSessionDurationMinutes" integer DEFAULT 60 NOT NULL,
    "allowedSessionDurations" integer[] DEFAULT ARRAY[60] NOT NULL,
    "meetingLinkAccessMinutesBefore" integer DEFAULT 15 NOT NULL,
    "allowedFileTypes" text[] DEFAULT ARRAY['image/jpeg'::text, 'image/png'::text, 'application/pdf'::text],
    currency text DEFAULT 'SDG'::text NOT NULL,
    "demosEnabled" boolean DEFAULT true NOT NULL,
    "maintenanceMode" boolean DEFAULT false NOT NULL,
    "maxFileSizeMB" integer DEFAULT 10 NOT NULL,
    "minHoursBeforeSession" integer DEFAULT 2 NOT NULL,
    "minWithdrawalAmount" numeric(10,2) DEFAULT 500 NOT NULL,
    "packagesEnabled" boolean DEFAULT true NOT NULL,
    "paymentWindowHours" integer DEFAULT 24 NOT NULL,
    "supportEmail" text DEFAULT 'support@sidra.com'::text NOT NULL,
    timezone text DEFAULT 'Africa/Khartoum'::text NOT NULL,
    "maxVacationDays" integer DEFAULT 21 NOT NULL,
    "searchConfig" jsonb
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: teacher_demo_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_demo_settings (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "demoEnabled" boolean DEFAULT false NOT NULL,
    "packagesEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_demo_settings OWNER TO postgres;

--
-- Name: teacher_package_tier_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_package_tier_settings (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "tierId" text NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_package_tier_settings OWNER TO postgres;

--
-- Name: teacher_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    bio text,
    "averageRating" double precision DEFAULT 0 NOT NULL,
    "cancellationPolicy" public."CancellationPolicy" DEFAULT 'FLEXIBLE'::public."CancellationPolicy" NOT NULL,
    "encryptedMeetingLink" text,
    gender public."Gender",
    "hasCompletedOnboarding" boolean DEFAULT false NOT NULL,
    "kycRejectionReason" text,
    "kycStatus" public."KYCStatus" DEFAULT 'PENDING'::public."KYCStatus" NOT NULL,
    "onboardingStep" integer DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "totalSessions" integer DEFAULT 0 NOT NULL,
    "yearsOfExperience" integer,
    "displayName" text,
    "applicationStatus" public."ApplicationStatus" DEFAULT 'DRAFT'::public."ApplicationStatus" NOT NULL,
    "changeRequestReason" text,
    "fullName" text,
    "interviewLink" text,
    "interviewScheduledAt" timestamp(3) without time zone,
    "introVideoUrl" text,
    "profilePhotoUrl" text,
    "rejectedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "submittedAt" timestamp(3) without time zone,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "termsAcceptedAt" timestamp(3) without time zone,
    "termsVersion" text,
    city text,
    country text,
    "dateOfBirth" timestamp(3) without time zone,
    "idImageUrl" text,
    "idNumber" text,
    "idType" public."IdType",
    slug text,
    "slugLockedAt" timestamp(3) without time zone,
    "teachingStyle" text,
    "whatsappNumber" text,
    "isOnVacation" boolean DEFAULT false NOT NULL,
    "vacationEndDate" timestamp(3) without time zone,
    "vacationReason" text,
    "vacationStartDate" timestamp(3) without time zone
);


ALTER TABLE public.teacher_profiles OWNER TO postgres;

--
-- Name: teacher_qualifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_qualifications (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "degreeName" text NOT NULL,
    institution text NOT NULL,
    "fieldOfStudy" text,
    status public."QualificationStatus" DEFAULT 'GRADUATED'::public."QualificationStatus" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "graduationYear" integer,
    "certificateUrl" text NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedBy" text,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_qualifications OWNER TO postgres;

--
-- Name: teacher_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_skills (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    name text NOT NULL,
    category public."SkillCategory",
    proficiency public."SkillProficiency" DEFAULT 'INTERMEDIATE'::public."SkillProficiency" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_skills OWNER TO postgres;

--
-- Name: teacher_subject_grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_subject_grades (
    "teacherSubjectId" text NOT NULL,
    "gradeLevelId" text NOT NULL
);


ALTER TABLE public.teacher_subject_grades OWNER TO postgres;

--
-- Name: teacher_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_subjects (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "subjectId" text NOT NULL,
    "curriculumId" text NOT NULL,
    "pricePerHour" numeric(10,2) NOT NULL
);


ALTER TABLE public.teacher_subjects OWNER TO postgres;

--
-- Name: teacher_teaching_approach_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_teaching_approach_tags (
    "teacherId" text NOT NULL,
    "tagId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.teacher_teaching_approach_tags OWNER TO postgres;

--
-- Name: teacher_work_experiences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_work_experiences (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    title text NOT NULL,
    organization text NOT NULL,
    "experienceType" public."ExperienceType" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "isCurrent" boolean DEFAULT false NOT NULL,
    description text,
    subjects text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teacher_work_experiences OWNER TO postgres;

--
-- Name: teaching_approach_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teaching_approach_tags (
    id text NOT NULL,
    "labelAr" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.teaching_approach_tags OWNER TO postgres;

--
-- Name: ticket_access_controls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_access_controls (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "userId" text NOT NULL,
    "canView" boolean DEFAULT true NOT NULL,
    "canReply" boolean DEFAULT true NOT NULL,
    "canClose" boolean DEFAULT false NOT NULL,
    "canReopen" boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "revokedByUserId" text,
    "revokedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_access_controls OWNER TO postgres;

--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_messages (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "authorId" text NOT NULL,
    content text NOT NULL,
    attachments text[] DEFAULT ARRAY[]::text[],
    "isInternal" boolean DEFAULT false NOT NULL,
    "isSystemGenerated" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.ticket_messages OWNER TO postgres;

--
-- Name: ticket_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_status_history (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    "fromStatus" public."TicketStatus",
    "toStatus" public."TicketStatus" NOT NULL,
    "changedByUserId" text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_status_history OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "walletId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    type public."TransactionType" NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    "referenceImage" text,
    "adminNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bankSnapshot" jsonb,
    "paidAt" timestamp(3) without time zone,
    "proofDocumentId" text,
    "readableId" text,
    "referenceId" text
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text,
    "passwordHash" text NOT NULL,
    role public."UserRole" NOT NULL,
    "phoneNumber" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "requirePasswordChange" boolean DEFAULT false NOT NULL,
    "createdByAdminId" text,
    "firstName" text,
    "lastName" text,
    "permissionOverrides" jsonb
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id text NOT NULL,
    "userId" text NOT NULL,
    balance numeric(10,2) DEFAULT 0 NOT NULL,
    "pendingBalance" numeric(10,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'SDG'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "readableId" text
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3fb111e8-6534-48a3-b4f5-f0bbd8a964d5	7edcf7471d2ca76e4b87ae77bdcffa7839d43ae276f8154529ea1e8ccb76be32	2025-12-30 11:40:13.898504+00	20251228102640_add_session_reminder_tracking	\N	\N	2025-12-30 11:40:13.894873+00	1
34e7ad1c-ce7f-48a0-bba7-7abe642593d8	dca1283c9204461dbb21e7d90b70e8fa75c8358442349f79b821693d8d21eaf4	2025-12-30 11:40:13.756344+00	20251214100258_init_refactor	\N	\N	2025-12-30 11:40:13.724913+00	1
200490b5-6c8c-4fee-aca6-a9f9296e2dbd	bae9006113429a9d61bbf77c01938edce80f46efa64c5d0dc8452030eb085668	2025-12-30 11:40:13.783561+00	20251220093718_phone_first_identity	\N	\N	2025-12-30 11:40:13.757729+00	1
eddbb920-9018-495e-b7a6-9994d04ef245	cdc48c39edec5d001513a7235c193c3788276f935ec99becd85f65c4eed17284	2026-01-03 09:52:09.270474+00	20260102120230_add_recurring_patterns_multi_slot	\N	\N	2026-01-03 09:52:09.26336+00	1
de78b1fa-008b-4984-bdbb-3e5a16498345	ed5b9f52d793488eee0eb0590d61270785bfa1d967075b64af7465b64e605915	2025-12-30 11:40:13.789698+00	20251220094055_add_password_recovery_fields	\N	\N	2025-12-30 11:40:13.785136+00	1
2f060a9e-2bc7-4a0c-9974-59cf09c4ad9b	9ae857294921e3717d260387c8e70166e6ac772a122edd666ce53d3c31a37a0f	2025-12-30 11:40:13.902877+00	20251228111953_add_phase1_notification_types	\N	\N	2025-12-30 11:40:13.899665+00	1
05bbcb55-5a90-4fcb-8de7-9e76da750b73	1be3685e15e6cf2eb6e724df5bd623cf5052e2486a997b06030e470577ae2302	2025-12-30 11:40:13.797797+00	20251220134504_dispute_window_implementation	\N	\N	2025-12-30 11:40:13.791257+00	1
19823d08-d99d-4492-8e60-fc6acf993090	c6facf7b0db7b526cf6d6f87073dc704ba0690f02ef518fbca8e72145103d9be	2025-12-30 11:40:13.803752+00	20251226140624_add_max_price_per_hour_setting	\N	\N	2025-12-30 11:40:13.799707+00	1
a4edd979-efe3-40bd-9541-f52ac3c771f6	3f3bb088ca01e111d9d5e01a0ac42a9c3de328580887d1709807aeb699a1220b	2025-12-30 11:40:13.815231+00	20251226142228_add_session_duration_config	\N	\N	2025-12-30 11:40:13.81039+00	1
08ee1e35-c268-4707-8e73-3759c620e556	e1cfcebb549974258e2e335ca0eed78e957eb013835e91bab1d9e8f47ca40001	2025-12-30 11:40:13.930448+00	20251228220432_add_support_ticket_system	\N	\N	2025-12-30 11:40:13.904215+00	1
57bebf29-df72-4f57-bb3f-c72fff99dfe2	a2b4e3030218f8f74ef258b12e507f277bd093bd7321e4d9be8213f8804ef572	2025-12-30 11:40:13.820324+00	20251226144843_add_ledger_transaction_types	\N	\N	2025-12-30 11:40:13.816344+00	1
0bd4789a-d6ff-41ab-bd5e-8836b27b8513	009a74aca44c35332911bb5aabe3785a1762b2482ccff89e180581d820a81a84	2025-12-30 11:40:13.825677+00	20251226235500_add_meeting_link_config	\N	\N	2025-12-30 11:40:13.821613+00	1
fd80bc38-a0cc-4d62-b156-f0e6571fde30	bf35df05a1a4d97b7c8aad0aecbdefa0e86434c6705f8e481d3cba8ca7ccf947	2025-12-30 11:40:13.834757+00	20251227000000_add_interview_time_slots	\N	\N	2025-12-30 11:40:13.827213+00	1
26a9a0ab-9a1f-4547-ad92-95c1bad80da3	3ab20f4f6544dac5d46622002368ea3c817f35a8faa7bee6842cf29cddc5d5ab	2025-12-30 13:34:42.793771+00	20251230120000_add_vacation_mode	\N	\N	2025-12-30 13:34:42.78357+00	1
d14d1792-9a91-45f8-a556-025aed18fa27	12ba6080e99158e14bc87a09ad9f8ceb155dbe7fba212237a3c6851367e4dcf0	2025-12-30 11:40:13.839972+00	20251227120000_add_teacher_terms_acceptance	\N	\N	2025-12-30 11:40:13.836176+00	1
59df5a7c-90b0-4f29-9fa6-0fad82478928	8397166ee8502b8d3b0764660324db2c28765bb3e656cce5e585f565544a72a7	2025-12-30 11:40:13.885202+00	20251227165356_add_smart_pack_configuration	\N	\N	2025-12-30 11:40:13.842023+00	1
6320e75d-3b8d-4ed1-8295-7708f5924d24	73470a1f37983198272ff505aacc68cae7ccb4a35635be4ba283eab6e2f54f3b	2026-01-03 09:52:09.285961+00	20260103040000_add_refresh_token_and_ledger_audit	\N	\N	2026-01-03 09:52:09.272968+00	1
2bb2b21c-fe53-462e-930f-497212f70b5d	97d23a9892a4223bebc31e8ef67eb834482d7bdfe79dedd505b01098d04eda9d	2025-12-30 11:40:13.893483+00	20251227200000_remove_education_add_qualifications	\N	\N	2025-12-30 11:40:13.886923+00	1
5e34e3b0-4037-45fc-975a-51d68f990a67	9714628acb20f28de2caceef17fa089dcf8f00af3323349d22afa625207e8aa0	2025-12-31 06:23:43.264653+00	20251231000000_add_curriculum_to_student_and_child	\N	\N	2025-12-31 06:23:43.163339+00	1
b697c02f-d419-49eb-a3be-1279bc3ee130	6aa63507cf3327ed204190511cb7a8358126440b4e0a4dad492e351456fd0cab	2026-01-01 07:51:10.380492+00	20260101000000_add_search_config_to_system_settings	\N	\N	2026-01-01 07:51:10.371368+00	1
c79a5230-84b9-4562-bfe6-b07652979cb7	e02676fdd709feed2af68eb6f6f40d08f80bb369bd5aeb9d93c2a36bf61da9fa	2026-01-02 11:40:49.782584+00	20260102075016_add_cancelled_by_teacher_enum	\N	\N	2026-01-02 11:40:49.68507+00	1
9a1a9c4f-405c-482b-a538-4a9efed87a23	0c402c1a0ed4d35efc60aec10d1a33663242ebbe90a48076ccfd83c3e5262f05	2026-01-02 11:40:49.921499+00	20260102081510_add_skills_and_experience_tables	\N	\N	2026-01-02 11:40:49.820291+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, payload, "actorId", "targetId", "createdAt", action) FROM stdin;
93d069f3-b897-4ca9-bb11-ca2b55e18631	{"changes": {"demosEnabled": true, "searchConfig": {"enablePriceFilter": true}, "maxPricePerHour": 50000, "maxVacationDays": 21, "packagesEnabled": false, "autoReleaseHours": 24, "paymentWindowHours": 24, "platformFeePercent": 25, "minHoursBeforeSession": 2, "defaultSessionDurationMinutes": 60, "meetingLinkAccessMinutesBefore": 5}, "newValues": {"rate": 0.25, "window": 24}, "oldValues": {"rate": 0.18, "window": 48}}	superadmin-omer-73bfe185048e	default	2026-01-01 08:08:00.956	SETTINGS_UPDATE
\.


--
-- Data for Name: availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability (id, "teacherId", "dayOfWeek", "startTime", "endTime", "isRecurring") FROM stdin;
\.


--
-- Data for Name: availability_exceptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_exceptions (id, "teacherId", "startDate", "endDate", type, "startTime", "endTime", reason, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bank_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_info (id, "teacherId", "bankName", "accountNumber", "accountHolderName", iban, "swiftCode", "bankBranch") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, "bookedByUserId", "beneficiaryType", "childId", "studentUserId", "teacherId", "subjectId", "startTime", "endTime", "meetingLink", price, "commissionRate", status, "cancelReason", "createdAt", "updatedAt", "autoReleaseAt", "cancellationPolicySnapshot", "cancelledAt", "cancelledBy", "paymentReleasedAt", "refundAmount", "refundPercent", "reminderSentAt", "studentConfirmedAt", "teacherCompAmount", "teacherCompletedAt", timezone, "disputeReminderSentAt", "disputeWindowClosesAt", "disputeWindowOpensAt", "meetingLinkReminderSentAt", "additionalNotes", "bookingNotes", "homeworkAssigned", "homeworkDescription", "lastRescheduledAt", "maxReschedules", "nextSessionRecommendations", "originalScheduledAt", "packageSessionType", "paymentDeadline", "paymentLockedAt", "pendingTierId", "readableId", "rescheduleCount", "rescheduledByRole", "sessionProofUrl", "studentPerformanceNotes", "studentPerformanceRating", "teacherPrepNotes", "teacherSummary", "topicsCovered", "sessionReminderSentAt") FROM stdin;
\.


--
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.children (id, "parentId", name, "gradeLevel", "schoolName", "curriculumId") FROM stdin;
\.


--
-- Data for Name: curricula; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.curricula (id, "nameAr", "nameEn", "isActive", code, "systemType") FROM stdin;
e89703c3-66dc-40e8-96ae-0ff6483be879	المنهج السوداني	Sudanese Curriculum	t	SDC	NATIONAL
\.


--
-- Data for Name: curriculum_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.curriculum_subjects ("curriculumId", "subjectId") FROM stdin;
\.


--
-- Data for Name: demo_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demo_sessions (id, "demoOwnerId", "demoOwnerType", "beneficiaryId", "teacherId", status, "usedAt", "cancelledAt", "rescheduleCount", "createdAt") FROM stdin;
\.


--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disputes (id, "bookingId", "raisedByUserId", type, description, evidence, status, "resolvedByAdminId", resolution, "teacherPayout", "studentRefund", "createdAt", "resolvedAt", "supportTicketId") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, "teacherId", type, "fileName", "fileUrl", "uploadedAt") FROM stdin;
\.


--
-- Data for Name: educational_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.educational_stages (id, "curriculumId", "nameAr", "nameEn", sequence, "isActive") FROM stdin;
3bab92f7-c047-458e-9511-9a3205635d84	e89703c3-66dc-40e8-96ae-0ff6483be879	المرحلة الابتدائية	Primary	1	t
d0c42ea7-9c5d-4b6b-96aa-c729be19a75d	e89703c3-66dc-40e8-96ae-0ff6483be879	المرحلة المتوسطة	Intermediate	2	t
f8c823eb-c9bf-4761-a14f-e3199c63bdb8	e89703c3-66dc-40e8-96ae-0ff6483be879	المرحلة الثانوية	Secondary	3	t
\.


--
-- Data for Name: email_outbox; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_outbox (id, "to", subject, "templateId", payload, status, attempts, "lastAttempt", "nextRetryAt", "sentAt", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: grade_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_levels (id, "stageId", "nameAr", "nameEn", code, sequence, "isActive") FROM stdin;
911c0a31-c9e9-4262-bcc8-12bd1f2bf75b	3bab92f7-c047-458e-9511-9a3205635d84	الصف الأول	Grade 1	G1	1	t
f80f9568-cde0-46ba-9903-bd7aa5bf4a3b	3bab92f7-c047-458e-9511-9a3205635d84	الصف الثاني	Grade 2	G2	2	t
33c9b296-ab39-4259-80ff-b7f00dd8cad1	3bab92f7-c047-458e-9511-9a3205635d84	الصف الثالث	Grade 3	G3	3	t
387b5a1e-fb4a-4cc6-9e0e-45d251fc4dda	3bab92f7-c047-458e-9511-9a3205635d84	الصف الرابع	Grade 4	G4	4	t
5a565e15-4f3a-466c-a3cb-caedd49069e8	3bab92f7-c047-458e-9511-9a3205635d84	الصف الخامس	Grade 5	G5	5	t
f1c86e08-e80d-46ca-ae44-b800bd2b7f6c	3bab92f7-c047-458e-9511-9a3205635d84	الصف السادس	Grade 6	G6	6	t
fadff1be-ca86-4763-bcfe-e915678eb352	3bab92f7-c047-458e-9511-9a3205635d84	الثاني متوسط	Grade 8	G8	8	t
9eaedf4c-b5cf-49cf-8f21-c718ca9de06f	3bab92f7-c047-458e-9511-9a3205635d84	الثالث متوسط	Grade 9 	G9	9	t
ef6d4588-0b5f-4c4d-b852-11b148a46910	3bab92f7-c047-458e-9511-9a3205635d84	الأول ثانوي	Grade 10	G10	10	t
ed848257-30da-4507-9157-e202b22892e4	3bab92f7-c047-458e-9511-9a3205635d84	الثاني ثانوي	Grade 11	G11	11	t
6058aad2-fd03-4ae7-9cf1-e495af0b0f5f	3bab92f7-c047-458e-9511-9a3205635d84	الثالث ثانوي	Grade 12	G12	12	t
2d59e952-dcf9-4f5a-ac66-37760c5f8528	3bab92f7-c047-458e-9511-9a3205635d84	الأول متوسط	Grade 7	G7	7	f
\.


--
-- Data for Name: interview_time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_time_slots (id, "teacherProfileId", "proposedDateTime", "meetingLink", "isSelected", "createdAt") FROM stdin;
\.


--
-- Data for Name: ledger_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ledger_audit_logs (id, "runAt", "totalWallets", "walletsChecked", "discrepancyCount", status, "durationMs", details, "resolvedAt", "resolvedByUserId", "resolutionNote") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "userId", title, message, type, status, link, metadata, "dedupeKey", "readAt", "archivedAt", "expiresAt", "createdAt") FROM stdin;
819ddb78-61d1-48b6-a3a6-148280cab7d5	superadmin-omer-73bfe185048e	طلب انضمام معلم جديد	قدّم المعلم "أ. Sara" طلب انضمام للمنصة ويحتاج للمراجعة	ADMIN_ALERT	READ	/admin/teacher-applications	{"teacherName": "أ. Sara", "teacherUserId": "18cf74bd-d689-42a1-b891-cea10620fb3c", "applicationType": "NEW_TEACHER_APPLICATION"}	NEW_TEACHER_APP:18cf74bd-d689-42a1-b891-cea10620fb3c	2026-01-03 09:03:01.347	\N	\N	2026-01-02 17:41:12.193
\.


--
-- Data for Name: package_redemptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_redemptions (id, "packageId", "bookingId", status, "releasedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: package_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_tiers (id, "sessionCount", "discountPercent", "isActive", "displayOrder", "recurringRatio", "floatingRatio", "rescheduleLimit", "durationWeeks", "gracePeriodDays", "nameAr", "nameEn", "descriptionAr", "descriptionEn", "isFeatured", badge, "createdAt", "updatedAt") FROM stdin;
6c29bdc0-1702-4b0c-930a-1263964faafd	5	8.00	t	1	1.00	0.00	2	5	7	باقة التوفير				f		2026-01-01 09:15:08.566	2026-01-01 09:16:20.392
\.


--
-- Data for Name: package_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_transactions (id, "idempotencyKey", type, "packageId", amount, "createdAt") FROM stdin;
\.


--
-- Data for Name: parent_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_profiles (id, "userId", city, country, "whatsappNumber") FROM stdin;
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, "bookingId", "teacherId", "ratedByUserId", score, comment, "isVisible", "createdAt") FROM stdin;
\.


--
-- Data for Name: readable_id_counters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.readable_id_counters (id, type, "yearMonth", counter, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, "userId", "tokenHash", "expiresAt", "createdAt", revoked, "revokedAt", "replacedByToken", "deviceInfo") FROM stdin;
\.


--
-- Data for Name: reschedule_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reschedule_requests (id, "bookingId", "requestedById", "proposedStartTime", "proposedEndTime", reason, status, "respondedAt", "respondedById", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: saved_teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_teachers (id, "userId", "teacherId", "createdAt") FROM stdin;
\.


--
-- Data for Name: student_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_packages (id, "readableId", "payerId", "studentId", "teacherId", "subjectId", "tierId", "sessionCount", "sessionsUsed", "originalPricePerSession", "discountedPricePerSession", "perSessionReleaseAmount", "totalPaid", "escrowRemaining", status, "purchasedAt", "expiresAt", "isSmartPack", "recurringWeekday", "recurringTime", "recurringSessionCount", "floatingSessionCount", "floatingSessionsUsed", "rescheduleLimit", "firstScheduledSession", "lastScheduledSession", "gracePeriodEnds", "recurringPatterns") FROM stdin;
\.


--
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_profiles (id, "userId", "gradeLevel", bio, city, country, "whatsappNumber", "profilePhotoUrl", "schoolName", "curriculumId") FROM stdin;
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, "nameAr", "nameEn", "isActive") FROM stdin;
5aeb831d-83b0-4cf7-9786-a79f05759cee	التربية الإسلامية	Islamic Studies	t
60bbc875-32fc-409d-bb27-5df4f928a729	اللغة العربية	Arabic Language	t
4b33b262-f4fd-4511-b5f6-29f4e18c8926	اللغة الإنجليزية	English Language	t
c5a4858c-bbb2-4da3-92e1-c6eb5e42f63a	الرياضيات	Mathematics	t
caf6c5ea-5978-4a37-b530-7bea87b14b22	الفيزياء	Physics	t
b1dac42a-db34-4517-8537-63c8df5a7327	الكيمياء	Chemistry	t
a82c9d16-27dd-4159-a390-34194d234c2a	الأحياء	Biology	t
41e244b5-29ac-456d-b8da-63f58c8a8975	الجغرافيا	Geography	t
ae10386c-993a-4d61-9dc4-6219d43b37ff	التاريخ	History	t
2aace5b3-1c61-4e05-9058-e97b55d8dc46	علوم الحاسوب	Computer Science	t
179954a9-5409-445c-ac3d-e95deb968b80	العلوم الهندسية	Engineering Science	t
bcb8fb7b-87ae-438d-8ced-e3e8fff96b07	اللغة الفرنسية	French Language	t
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, "readableId", "createdByUserId", "assignedToId", category, type, priority, status, "linkedBookingId", "linkedTeacherId", "linkedStudentId", subject, description, evidence, "escalationLevel", "slaDeadline", "slaBreach", "resolvedAt", "resolvedByUserId", "resolutionNote", "disputeId", "createdAt", "updatedAt", "closedAt", "lastActivityAt") FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, "confirmationWindowHours", "autoReleaseEnabled", "reminderHoursBeforeRelease", "defaultCommissionRate", "createdAt", "updatedAt", "disputeWindowHours", "maxPricePerHour", "defaultSessionDurationMinutes", "allowedSessionDurations", "meetingLinkAccessMinutesBefore", "allowedFileTypes", currency, "demosEnabled", "maintenanceMode", "maxFileSizeMB", "minHoursBeforeSession", "minWithdrawalAmount", "packagesEnabled", "paymentWindowHours", "supportEmail", timezone, "maxVacationDays", "searchConfig") FROM stdin;
default	24	t	6	0.25	2025-12-30 14:00:00.158	2026-01-01 08:08:00.948	48	50000.00	60	{60}	5	{image/jpeg,image/png,application/pdf}	SDG	t	f	10	2	500.00	f	24	support@sidra.com	Africa/Khartoum	21	{"enablePriceFilter": true}
\.


--
-- Data for Name: teacher_demo_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_demo_settings (id, "teacherId", "demoEnabled", "packagesEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: teacher_package_tier_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_package_tier_settings (id, "teacherId", "tierId", "isEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: teacher_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_profiles (id, "userId", bio, "averageRating", "cancellationPolicy", "encryptedMeetingLink", gender, "hasCompletedOnboarding", "kycRejectionReason", "kycStatus", "onboardingStep", "totalReviews", "totalSessions", "yearsOfExperience", "displayName", "applicationStatus", "changeRequestReason", "fullName", "interviewLink", "interviewScheduledAt", "introVideoUrl", "profilePhotoUrl", "rejectedAt", "rejectionReason", "reviewedAt", "reviewedBy", "submittedAt", timezone, "termsAcceptedAt", "termsVersion", city, country, "dateOfBirth", "idImageUrl", "idNumber", "idType", slug, "slugLockedAt", "teachingStyle", "whatsappNumber", "isOnVacation", "vacationEndDate", "vacationReason", "vacationStartDate") FROM stdin;
9a853d12-b6aa-443f-9d3c-ccf56f99babe	4a2ef19a-e96d-44b7-bcc6-c8a67cb5597d	انا معلمة لغات. بدرس انجليزي و كوري و حاليا بتعلم في الالماني. \nحصصي دايما تفاعلية ، ممتعة و مرحة لانو التعليم بالنسبة لي اسلوب حياة اكتر من انو وظيفة.	0	FLEXIBLE	\N	FEMALE	f	\N	PENDING	0	0	0	7	أ. كويا	DRAFT	\N	كويا الطيب	\N	\N	\N	profile-photos/4a2ef19a-e96d-44b7-bcc6-c8a67cb5597d/1767367865100-gvdld-1000031332.jpg	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
b8fc3013-d351-4b07-a65c-e3ab6752d08f	8ed5d7fd-5aec-4c31-a1f8-2614dcd95a15	\N	0	FLEXIBLE	\N	FEMALE	f	\N	PENDING	0	0	0	\N	أ. Yousra	DRAFT	\N	Yousra Eltayeb	\N	\N	\N	\N	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
0e6db431-c7e0-48dd-8aee-69c2c25812f0	bf4be583-3def-441b-a1d8-221eab86613d		0	FLEXIBLE	\N	MALE	f	\N	PENDING	0	0	0	0	أ. Strict	DRAFT	\N	Strict Test	\N	\N	\N	profile-photos/bf4be583-3def-441b-a1d8-221eab86613d/1767372770111-8nohrj-Adobe_Express_-_file__1_.png	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
bd736b51-66ff-45c0-90b9-defbd32bb81e	75297ff8-8c8a-48e0-89e8-3605c5839211	\N	0	FLEXIBLE	\N	MALE	f	\N	PENDING	0	0	0	\N	أ. Test	DRAFT	\N	Test Teacher	\N	\N	\N	\N	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
b1c366d7-66f0-4d9a-9596-4a736596cdf8	18cf74bd-d689-42a1-b891-cea10620fb3c	معلمة رياضيات خطيرة معلمة رياضيات خطيرة معلمة رياضيات خطيرة معلمة رياضيات خطيرة	0	FLEXIBLE	\N	FEMALE	f	\N	PENDING	0	0	0	2	أ. Sara	SUBMITTED	\N	Sara Ali	\N	\N	\N	profile-photos/18cf74bd-d689-42a1-b891-cea10620fb3c/1767375531016-753ng-Whisk_c7b3d48199.jpg	\N	\N	\N	\N	2026-01-02 17:41:12.11	UTC	2026-01-02 17:41:11.42	1.0	\N	\N	\N	teacher-docs/18cf74bd-d689-42a1-b891-cea10620fb3c/1767375657860-570r1e-step-two.png	P0277364	PASSPORT	\N	\N	\N	\N	f	\N	\N	\N
0f2d3fdf-ea2f-436c-8347-b71dd13b42a6	66b5bfa8-4e3e-4771-a235-cf321557ea0d	معلم متمكن بخبرة عامين في تدريس الاطفال والطلاب في المراحل المختلفة بأسلوب شيق ومبسط. يساعد الطلاب على فهم الرياضيات بسهولة وتفوق. معلم متمكن بخبرة عامين في تدريس الاطفال والطلاب في المراحل المختلفة بأسلوب شيق ومبسط. يساعد الطلاب على فهم الرياضيات بسهولة وتفوق.	0	FLEXIBLE	\N	MALE	f	\N	PENDING	0	0	0	2	أ. TestTestAutoF	DRAFT	\N	TestTestAutoF TeacherAutoL	\N	\N	\N	profile-photos/66b5bfa8-4e3e-4771-a235-cf321557ea0d/1767369985979-8zbhy-profile.png	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	teacher-docs/66b5bfa8-4e3e-4771-a235-cf321557ea0d/1767372236706-x985v-id.png	1234567890	NATIONAL_ID	\N	\N	\N	\N	f	\N	\N	\N
7e7b4a78-e6a6-4605-b8d2-29ef1b051c0a	22997fc3-66a6-4c58-9405-7fae39fd8381	\N	0	FLEXIBLE	\N	\N	f	\N	PENDING	0	0	0	\N	أ. Test	DRAFT	\N	Test Fix	\N	\N	\N	\N	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
ffad796d-dda7-4b7c-af03-41576cd1722b	cc24f42f-8700-4761-955c-64734ff99722	حصص تفاعلية.\nنماذج امتحانات.\nخبرة في مجال تعليم اللغات الاونلاين.\nتدريس جميع المراحل.	0	FLEXIBLE	\N	FEMALE	f	\N	PENDING	0	0	0	7	أ. يسرا	DRAFT	\N	يسرا الطيب	\N	\N	\N	profile-photos/cc24f42f-8700-4761-955c-64734ff99722/1767381585745-sgvdo-1000031332.jpg	\N	\N	\N	\N	\N	UTC	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N
\.


--
-- Data for Name: teacher_qualifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_qualifications (id, "teacherId", "degreeName", institution, "fieldOfStudy", status, "startDate", "endDate", "graduationYear", "certificateUrl", verified, "verifiedAt", "verifiedBy", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
d2a48d13-39d2-4b8b-b5cb-3e54bb400aee	0f2d3fdf-ea2f-436c-8347-b71dd13b42a6	BSc Math	Khartoum Univ	\N	GRADUATED	\N	\N	2018	https://sidra-production.9dd5dc628fee4b969ffcea4da72ba7e4.r2.cloudflarestorage.com/teacher-docs/sample.png	f	\N	\N	\N	2026-01-02 16:39:04.706	2026-01-02 16:39:04.706
6b3b608b-23bb-4713-b0b7-7c3fcbbbe21c	b1c366d7-66f0-4d9a-9596-4a736596cdf8	حاسوب	النيلين	\N	GRADUATED	\N	\N	\N	teacher-docs/18cf74bd-d689-42a1-b891-cea10620fb3c/1767375580037-0a37uc-Adobe_Express_-_file__2_.png	f	\N	\N	\N	2026-01-02 17:39:45.345	2026-01-02 17:39:45.345
a68c05ef-c70e-4d05-9d6e-86d479a61111	ffad796d-dda7-4b7c-af03-41576cd1722b	بكالوريوس تكنولوجيا وعلوم الإنتاج الحيواني	جامعة السودان للعلوم والتكنولوجيا	إنتاج الألبان	GRADUATED	2016-11-14 00:00:00	2024-02-10 00:00:00	2024	teacher-docs/cc24f42f-8700-4761-955c-64734ff99722/1767381768330-j2rsac-Yousra_TEFL_Certificate.pdf	f	\N	\N	\N	2026-01-02 19:22:55.73	2026-01-02 19:22:55.73
\.


--
-- Data for Name: teacher_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_skills (id, "teacherId", name, category, proficiency, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: teacher_subject_grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_subject_grades ("teacherSubjectId", "gradeLevelId") FROM stdin;
07d525b6-43ec-4d39-84fd-a2bb7de199e4	387b5a1e-fb4a-4cc6-9e0e-45d251fc4dda
07d525b6-43ec-4d39-84fd-a2bb7de199e4	5a565e15-4f3a-466c-a3cb-caedd49069e8
07d525b6-43ec-4d39-84fd-a2bb7de199e4	33c9b296-ab39-4259-80ff-b7f00dd8cad1
07d525b6-43ec-4d39-84fd-a2bb7de199e4	f1c86e08-e80d-46ca-ae44-b800bd2b7f6c
07d525b6-43ec-4d39-84fd-a2bb7de199e4	911c0a31-c9e9-4262-bcc8-12bd1f2bf75b
07d525b6-43ec-4d39-84fd-a2bb7de199e4	f80f9568-cde0-46ba-9903-bd7aa5bf4a3b
07d525b6-43ec-4d39-84fd-a2bb7de199e4	fadff1be-ca86-4763-bcfe-e915678eb352
07d525b6-43ec-4d39-84fd-a2bb7de199e4	2d59e952-dcf9-4f5a-ac66-37760c5f8528
07d525b6-43ec-4d39-84fd-a2bb7de199e4	9eaedf4c-b5cf-49cf-8f21-c718ca9de06f
07d525b6-43ec-4d39-84fd-a2bb7de199e4	ed848257-30da-4507-9157-e202b22892e4
07d525b6-43ec-4d39-84fd-a2bb7de199e4	ef6d4588-0b5f-4c4d-b852-11b148a46910
07d525b6-43ec-4d39-84fd-a2bb7de199e4	6058aad2-fd03-4ae7-9cf1-e495af0b0f5f
149358db-1a42-4141-831f-bf761be2c293	911c0a31-c9e9-4262-bcc8-12bd1f2bf75b
149358db-1a42-4141-831f-bf761be2c293	f80f9568-cde0-46ba-9903-bd7aa5bf4a3b
149358db-1a42-4141-831f-bf761be2c293	33c9b296-ab39-4259-80ff-b7f00dd8cad1
149358db-1a42-4141-831f-bf761be2c293	387b5a1e-fb4a-4cc6-9e0e-45d251fc4dda
149358db-1a42-4141-831f-bf761be2c293	5a565e15-4f3a-466c-a3cb-caedd49069e8
149358db-1a42-4141-831f-bf761be2c293	f1c86e08-e80d-46ca-ae44-b800bd2b7f6c
149358db-1a42-4141-831f-bf761be2c293	fadff1be-ca86-4763-bcfe-e915678eb352
149358db-1a42-4141-831f-bf761be2c293	9eaedf4c-b5cf-49cf-8f21-c718ca9de06f
149358db-1a42-4141-831f-bf761be2c293	ef6d4588-0b5f-4c4d-b852-11b148a46910
149358db-1a42-4141-831f-bf761be2c293	ed848257-30da-4507-9157-e202b22892e4
149358db-1a42-4141-831f-bf761be2c293	6058aad2-fd03-4ae7-9cf1-e495af0b0f5f
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	911c0a31-c9e9-4262-bcc8-12bd1f2bf75b
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	f80f9568-cde0-46ba-9903-bd7aa5bf4a3b
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	33c9b296-ab39-4259-80ff-b7f00dd8cad1
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	387b5a1e-fb4a-4cc6-9e0e-45d251fc4dda
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	5a565e15-4f3a-466c-a3cb-caedd49069e8
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	f1c86e08-e80d-46ca-ae44-b800bd2b7f6c
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	fadff1be-ca86-4763-bcfe-e915678eb352
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	9eaedf4c-b5cf-49cf-8f21-c718ca9de06f
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	ef6d4588-0b5f-4c4d-b852-11b148a46910
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	ed848257-30da-4507-9157-e202b22892e4
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	6058aad2-fd03-4ae7-9cf1-e495af0b0f5f
3aac3a3e-0f68-4997-bdb1-5ae106b18e16	911c0a31-c9e9-4262-bcc8-12bd1f2bf75b
\.


--
-- Data for Name: teacher_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_subjects (id, "teacherId", "subjectId", "curriculumId", "pricePerHour") FROM stdin;
07d525b6-43ec-4d39-84fd-a2bb7de199e4	9a853d12-b6aa-443f-9d3c-ccf56f99babe	4b33b262-f4fd-4511-b5f6-29f4e18c8926	e89703c3-66dc-40e8-96ae-0ff6483be879	20000.00
149358db-1a42-4141-831f-bf761be2c293	0f2d3fdf-ea2f-436c-8347-b71dd13b42a6	c5a4858c-bbb2-4da3-92e1-c6eb5e42f63a	e89703c3-66dc-40e8-96ae-0ff6483be879	5000.00
0e3d3b2c-29ad-48be-bf9f-3406b98f96d7	b1c366d7-66f0-4d9a-9596-4a736596cdf8	60bbc875-32fc-409d-bb27-5df4f928a729	e89703c3-66dc-40e8-96ae-0ff6483be879	2500.00
3aac3a3e-0f68-4997-bdb1-5ae106b18e16	ffad796d-dda7-4b7c-af03-41576cd1722b	4b33b262-f4fd-4511-b5f6-29f4e18c8926	e89703c3-66dc-40e8-96ae-0ff6483be879	20000.00
\.


--
-- Data for Name: teacher_teaching_approach_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_teaching_approach_tags ("teacherId", "tagId", "createdAt") FROM stdin;
\.


--
-- Data for Name: teacher_work_experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_work_experiences (id, "teacherId", title, organization, "experienceType", "startDate", "endDate", "isCurrent", description, subjects, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: teaching_approach_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teaching_approach_tags (id, "labelAr", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
5cf0212f-0c6e-48e0-b2c6-9630f09faabb	📘 يحتاجون شرح مبسط	t	1	2026-01-01 09:09:37.493	2026-01-01 09:09:45.599
0c3ab0a1-f380-413c-85a1-5cd881263ca6	🌍 يفهمون بالتمثيل والأمثلة	t	2	2026-01-01 09:10:53.255	2026-01-01 09:10:53.255
e81d9180-ae63-4b67-ab47-75d884f0b0b3	🧠 يفضلون الفهم بدل الحفظ	t	3	2026-01-01 09:11:04.184	2026-01-01 09:11:04.184
83eaeb99-cbae-444b-9e5b-e774ebd0dd7f	🔗 يحبون الربط بالحياة الواقعية	t	4	2026-01-01 09:11:14.92	2026-01-01 09:11:14.92
f2475cda-0f9a-41fc-8d19-8c0cb90dac49	🎯 يستعدون للاختبارات	t	5	2026-01-01 09:11:28.229	2026-01-01 09:11:28.229
74f17bb2-5073-4e27-a12b-4e526e1d9af2	✍️ يركّزون على حل الأسئلة	t	6	2026-01-01 09:11:39.209	2026-01-01 09:11:39.209
b1bc0e58-7b5e-4857-aa07-353a7886441a	📈 يريدون رفع مستواهم الدراسي	t	7	2026-01-01 09:11:51.118	2026-01-01 09:11:51.118
8574c798-9dca-468e-98cd-4a5709757df2	🧱 يعانون من ضعف في الأساسيات	t	8	2026-01-01 09:12:02.079	2026-01-01 09:12:02.079
57321320-51d1-4ae1-86d9-2c0a04dac712	💡 يفضلون التعلم التفاعلي	t	9	2026-01-01 09:12:12.157	2026-01-01 09:12:12.157
5757cd18-9169-473d-a076-a80744515326	💬 يحبون النقاش وطرح الأسئلة	t	10	2026-01-01 09:12:30.158	2026-01-01 09:12:30.158
5257616b-04d2-4877-a661-6b9134197e49	🪜 يتعلمون بالخطوات المتدرجة	t	11	2026-01-01 09:12:53.402	2026-01-01 09:12:53.402
753536a7-63fe-4a4c-958a-8c606b8054ee	👀 يحتاجون متابعة مستمرة	t	12	2026-01-01 09:13:03.979	2026-01-01 09:13:03.979
1fdc2c97-5246-47ba-9f8f-f3b18e944fe3	🧒 طلاب المراحل الأولى	t	13	2026-01-01 09:13:14.031	2026-01-01 09:13:14.031
eec4893b-b2e2-4f10-befd-5bd7049a368b	👦 طلاب المرحلة المتوسطة	t	14	2026-01-01 09:13:23.905	2026-01-01 09:13:23.905
8cfdd3bf-313f-4fd8-a349-0f4f887fcff1	🎓 طلاب المرحلة الثانوية	t	15	2026-01-01 09:13:34.713	2026-01-01 09:13:34.713
d8f8b797-0813-466f-a768-14e809ef4ba2	⏳ يحتاجون وقت إضافي للفهم	t	16	2026-01-01 09:13:44.919	2026-01-01 09:13:44.919
500c2653-7ce9-4ed9-b406-ebd1f32f7e69	⚡ يتعلمون بسرعة	t	17	2026-01-01 09:13:54.422	2026-01-01 09:13:54.422
a29760de-78e7-49f2-a1dd-e5e032cd0375	🌱 يحتاجون تشجيع وتحفيز	t	18	2026-01-01 09:14:04.034	2026-01-01 09:14:04.034
a069b926-a7a7-4ccc-95cc-079d1c6b464e	😟 يعانون من رهبة الامتحانات	t	19	2026-01-01 09:14:15.557	2026-01-01 09:14:15.557
\.


--
-- Data for Name: ticket_access_controls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_access_controls (id, "ticketId", "userId", "canView", "canReply", "canClose", "canReopen", "revokedAt", "revokedByUserId", "revokedReason", "createdAt") FROM stdin;
\.


--
-- Data for Name: ticket_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_messages (id, "ticketId", "authorId", content, attachments, "isInternal", "isSystemGenerated", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: ticket_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_status_history (id, "ticketId", "fromStatus", "toStatus", "changedByUserId", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, "walletId", amount, type, status, "referenceImage", "adminNote", "createdAt", "updatedAt", "bankSnapshot", "paidAt", "proofDocumentId", "readableId", "referenceId") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, "passwordHash", role, "phoneNumber", "isActive", "isVerified", "createdAt", "updatedAt", "requirePasswordChange", "createdByAdminId", "firstName", "lastName", "permissionOverrides") FROM stdin;
superadmin-omer-73bfe185048e	omer@sidra.sd	$2b$10$Iik..Ma7CqH91gKEVr9ue.jBGZgptMK3JvKSYcBFgstoQLHnRL1Hi	SUPER_ADMIN	+821083599666	t	t	2026-01-01 08:05:26.47	2026-01-01 09:18:35.67	f	\N	Omer	Admin	\N
8ed5d7fd-5aec-4c31-a1f8-2614dcd95a15	\N	$2b$10$jvDJoAl7PrVvMdRzuk.Pr.Ppu4VBk8Ek0kG0GgW.ky7LvXQ0ZVVdu	TEACHER	+2491141302624	t	f	2026-01-02 12:52:18.384	2026-01-02 12:52:18.384	f	\N	Yousra	Eltayeb	\N
75297ff8-8c8a-48e0-89e8-3605c5839211	test.teacher@example.com	$2b$10$g.SytFMdGkRYMjXguv9B.OPGsFLPXMqN56zL2VVEud1hbK3L4wvOy	TEACHER	+249912345678	t	f	2026-01-02 14:04:54.934	2026-01-02 14:04:54.934	f	\N	Test	Teacher	\N
18cf74bd-d689-42a1-b891-cea10620fb3c	sara@sidra.sd	$2b$10$mksSBRuYptwdA3zLdml9n.YOgdYYjy1RxVfK16gw7DtQgVuvhxs.6	TEACHER	+249111110123	t	f	2026-01-02 15:14:47.369	2026-01-02 15:14:47.369	f	\N	Sara	Ali	\N
4a2ef19a-e96d-44b7-bcc6-c8a67cb5597d	\N	$2b$10$SKOSUyQk0dy8CWb9Sbq06eekCWbZXW4R/DBTtoa.Q.pNbY2WgLhSu	TEACHER	+249114130407	t	f	2026-01-02 15:30:45.321	2026-01-02 15:30:45.321	f	\N	كويا	الطيب	\N
66b5bfa8-4e3e-4771-a235-cf321557ea0d	testteacher_auto_1@sidra.sd	$2b$10$KXIZS3M12ZGqK.spXZjKiOxjXbr5L2UBJdNQdfDhcTsfwNNRgxkv.	TEACHER	+249999000123	t	f	2026-01-02 16:05:23.064	2026-01-02 16:05:23.064	f	\N	TestTestAutoF	TeacherAutoL	\N
22997fc3-66a6-4c58-9405-7fae39fd8381	\N	$2b$10$MjIk4aTC0eitrSElobVJJe3K0YARL8XQDqoKGPlcCzc72rjyL3X3.	TEACHER	+249999000124	t	f	2026-01-02 16:31:38.954	2026-01-02 16:31:38.954	f	\N	Test	Fix	\N
bf4be583-3def-441b-a1d8-221eab86613d	\N	$2b$10$P9eq2YiSWrfAt.m5q5A.Xe.qZtr08n5zuhj0dscHz95IvG99qI5hy	TEACHER	+249999000125	t	f	2026-01-02 16:51:22.822	2026-01-02 16:51:22.822	f	\N	Strict	Test	\N
cc24f42f-8700-4761-955c-64734ff99722	\N	$2b$10$w3u/jz7btZOB4RAlb6kUc.8Xs/f5tt1JWlILFhcZSzCZrSSS7KnLu	TEACHER	+249114130246	t	f	2026-01-02 19:19:11.482	2026-01-02 19:19:11.482	f	\N	يسرا	الطيب	\N
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, "userId", balance, "pendingBalance", currency, "createdAt", "updatedAt", "readableId") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: availability_exceptions availability_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_exceptions
    ADD CONSTRAINT availability_exceptions_pkey PRIMARY KEY (id);


--
-- Name: availability availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT availability_pkey PRIMARY KEY (id);


--
-- Name: bank_info bank_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_info
    ADD CONSTRAINT bank_info_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: children children_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_pkey PRIMARY KEY (id);


--
-- Name: curricula curricula_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curricula
    ADD CONSTRAINT curricula_pkey PRIMARY KEY (id);


--
-- Name: curriculum_subjects curriculum_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_subjects
    ADD CONSTRAINT curriculum_subjects_pkey PRIMARY KEY ("curriculumId", "subjectId");


--
-- Name: demo_sessions demo_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demo_sessions
    ADD CONSTRAINT demo_sessions_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: educational_stages educational_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.educational_stages
    ADD CONSTRAINT educational_stages_pkey PRIMARY KEY (id);


--
-- Name: email_outbox email_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_outbox
    ADD CONSTRAINT email_outbox_pkey PRIMARY KEY (id);


--
-- Name: grade_levels grade_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels
    ADD CONSTRAINT grade_levels_pkey PRIMARY KEY (id);


--
-- Name: interview_time_slots interview_time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_time_slots
    ADD CONSTRAINT interview_time_slots_pkey PRIMARY KEY (id);


--
-- Name: ledger_audit_logs ledger_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_audit_logs
    ADD CONSTRAINT ledger_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: package_redemptions package_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_redemptions
    ADD CONSTRAINT package_redemptions_pkey PRIMARY KEY (id);


--
-- Name: package_tiers package_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_tiers
    ADD CONSTRAINT package_tiers_pkey PRIMARY KEY (id);


--
-- Name: package_transactions package_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_transactions
    ADD CONSTRAINT package_transactions_pkey PRIMARY KEY (id);


--
-- Name: parent_profiles parent_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profiles
    ADD CONSTRAINT parent_profiles_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: readable_id_counters readable_id_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.readable_id_counters
    ADD CONSTRAINT readable_id_counters_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reschedule_requests reschedule_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reschedule_requests
    ADD CONSTRAINT reschedule_requests_pkey PRIMARY KEY (id);


--
-- Name: saved_teachers saved_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_teachers
    ADD CONSTRAINT saved_teachers_pkey PRIMARY KEY (id);


--
-- Name: student_packages student_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT student_packages_pkey PRIMARY KEY (id);


--
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: teacher_demo_settings teacher_demo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_demo_settings
    ADD CONSTRAINT teacher_demo_settings_pkey PRIMARY KEY (id);


--
-- Name: teacher_package_tier_settings teacher_package_tier_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_package_tier_settings
    ADD CONSTRAINT teacher_package_tier_settings_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_pkey PRIMARY KEY (id);


--
-- Name: teacher_qualifications teacher_qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_qualifications
    ADD CONSTRAINT teacher_qualifications_pkey PRIMARY KEY (id);


--
-- Name: teacher_skills teacher_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_skills
    ADD CONSTRAINT teacher_skills_pkey PRIMARY KEY (id);


--
-- Name: teacher_subject_grades teacher_subject_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject_grades
    ADD CONSTRAINT teacher_subject_grades_pkey PRIMARY KEY ("teacherSubjectId", "gradeLevelId");


--
-- Name: teacher_subjects teacher_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_pkey PRIMARY KEY (id);


--
-- Name: teacher_teaching_approach_tags teacher_teaching_approach_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_teaching_approach_tags
    ADD CONSTRAINT teacher_teaching_approach_tags_pkey PRIMARY KEY ("teacherId", "tagId");


--
-- Name: teacher_work_experiences teacher_work_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_work_experiences
    ADD CONSTRAINT teacher_work_experiences_pkey PRIMARY KEY (id);


--
-- Name: teaching_approach_tags teaching_approach_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teaching_approach_tags
    ADD CONSTRAINT teaching_approach_tags_pkey PRIMARY KEY (id);


--
-- Name: ticket_access_controls ticket_access_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_access_controls
    ADD CONSTRAINT ticket_access_controls_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: ticket_status_history ticket_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT ticket_status_history_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_actorId_idx" ON public.audit_logs USING btree ("actorId");


--
-- Name: availability_exceptions_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "availability_exceptions_teacherId_idx" ON public.availability_exceptions USING btree ("teacherId");


--
-- Name: bank_info_teacherId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bank_info_teacherId_key" ON public.bank_info USING btree ("teacherId");


--
-- Name: bookings_autoReleaseAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_autoReleaseAt_idx" ON public.bookings USING btree ("autoReleaseAt");


--
-- Name: bookings_beneficiaryType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_beneficiaryType_idx" ON public.bookings USING btree ("beneficiaryType");


--
-- Name: bookings_bookedByUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_bookedByUserId_idx" ON public.bookings USING btree ("bookedByUserId");


--
-- Name: bookings_readableId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bookings_readableId_key" ON public.bookings USING btree ("readableId");


--
-- Name: bookings_startTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_startTime_idx" ON public.bookings USING btree ("startTime");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: curricula_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX curricula_code_key ON public.curricula USING btree (code);


--
-- Name: demo_sessions_demoOwnerId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "demo_sessions_demoOwnerId_status_idx" ON public.demo_sessions USING btree ("demoOwnerId", status);


--
-- Name: demo_sessions_demoOwnerId_teacherId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "demo_sessions_demoOwnerId_teacherId_key" ON public.demo_sessions USING btree ("demoOwnerId", "teacherId");


--
-- Name: disputes_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disputes_bookingId_idx" ON public.disputes USING btree ("bookingId");


--
-- Name: disputes_bookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "disputes_bookingId_key" ON public.disputes USING btree ("bookingId");


--
-- Name: disputes_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX disputes_status_idx ON public.disputes USING btree (status);


--
-- Name: disputes_supportTicketId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "disputes_supportTicketId_key" ON public.disputes USING btree ("supportTicketId");


--
-- Name: email_outbox_status_nextRetryAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "email_outbox_status_nextRetryAt_idx" ON public.email_outbox USING btree (status, "nextRetryAt");


--
-- Name: grade_levels_stageId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "grade_levels_stageId_code_key" ON public.grade_levels USING btree ("stageId", code);


--
-- Name: ledger_audit_logs_runAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ledger_audit_logs_runAt_idx" ON public.ledger_audit_logs USING btree ("runAt");


--
-- Name: ledger_audit_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ledger_audit_logs_status_idx ON public.ledger_audit_logs USING btree (status);


--
-- Name: notifications_dedupeKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "notifications_dedupeKey_key" ON public.notifications USING btree ("dedupeKey");


--
-- Name: notifications_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_createdAt_idx" ON public.notifications USING btree ("userId", "createdAt");


--
-- Name: notifications_userId_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_status_createdAt_idx" ON public.notifications USING btree ("userId", status, "createdAt");


--
-- Name: package_redemptions_bookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "package_redemptions_bookingId_key" ON public.package_redemptions USING btree ("bookingId");


--
-- Name: package_redemptions_packageId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "package_redemptions_packageId_status_idx" ON public.package_redemptions USING btree ("packageId", status);


--
-- Name: package_transactions_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "package_transactions_idempotencyKey_key" ON public.package_transactions USING btree ("idempotencyKey");


--
-- Name: package_transactions_packageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "package_transactions_packageId_idx" ON public.package_transactions USING btree ("packageId");


--
-- Name: parent_profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "parent_profiles_userId_key" ON public.parent_profiles USING btree ("userId");


--
-- Name: ratings_bookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ratings_bookingId_key" ON public.ratings USING btree ("bookingId");


--
-- Name: ratings_isVisible_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ratings_isVisible_idx" ON public.ratings USING btree ("isVisible");


--
-- Name: ratings_ratedByUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ratings_ratedByUserId_idx" ON public.ratings USING btree ("ratedByUserId");


--
-- Name: ratings_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ratings_teacherId_idx" ON public.ratings USING btree ("teacherId");


--
-- Name: readable_id_counters_type_yearMonth_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "readable_id_counters_type_yearMonth_key" ON public.readable_id_counters USING btree (type, "yearMonth");


--
-- Name: refresh_tokens_tokenHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "refresh_tokens_tokenHash_idx" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: reschedule_requests_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reschedule_requests_bookingId_idx" ON public.reschedule_requests USING btree ("bookingId");


--
-- Name: reschedule_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reschedule_requests_status_idx ON public.reschedule_requests USING btree (status);


--
-- Name: saved_teachers_userId_teacherId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "saved_teachers_userId_teacherId_key" ON public.saved_teachers USING btree ("userId", "teacherId");


--
-- Name: student_packages_payerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_packages_payerId_idx" ON public.student_packages USING btree ("payerId");


--
-- Name: student_packages_readableId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "student_packages_readableId_key" ON public.student_packages USING btree ("readableId");


--
-- Name: student_packages_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX student_packages_status_idx ON public.student_packages USING btree (status);


--
-- Name: student_packages_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_packages_studentId_idx" ON public.student_packages USING btree ("studentId");


--
-- Name: student_packages_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_packages_teacherId_idx" ON public.student_packages USING btree ("teacherId");


--
-- Name: student_packages_tierId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_packages_tierId_idx" ON public.student_packages USING btree ("tierId");


--
-- Name: student_profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "student_profiles_userId_key" ON public.student_profiles USING btree ("userId");


--
-- Name: support_tickets_assignedToId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_assignedToId_idx" ON public.support_tickets USING btree ("assignedToId");


--
-- Name: support_tickets_createdByUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_createdByUserId_idx" ON public.support_tickets USING btree ("createdByUserId");


--
-- Name: support_tickets_disputeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "support_tickets_disputeId_key" ON public.support_tickets USING btree ("disputeId");


--
-- Name: support_tickets_escalationLevel_slaBreach_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_escalationLevel_slaBreach_idx" ON public.support_tickets USING btree ("escalationLevel", "slaBreach");


--
-- Name: support_tickets_lastActivityAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_lastActivityAt_idx" ON public.support_tickets USING btree ("lastActivityAt");


--
-- Name: support_tickets_linkedBookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "support_tickets_linkedBookingId_idx" ON public.support_tickets USING btree ("linkedBookingId");


--
-- Name: support_tickets_readableId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "support_tickets_readableId_key" ON public.support_tickets USING btree ("readableId");


--
-- Name: support_tickets_status_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_status_priority_idx ON public.support_tickets USING btree (status, priority);


--
-- Name: support_tickets_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX support_tickets_type_status_idx ON public.support_tickets USING btree (type, status);


--
-- Name: teacher_demo_settings_teacherId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "teacher_demo_settings_teacherId_key" ON public.teacher_demo_settings USING btree ("teacherId");


--
-- Name: teacher_package_tier_settings_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "teacher_package_tier_settings_teacherId_idx" ON public.teacher_package_tier_settings USING btree ("teacherId");


--
-- Name: teacher_package_tier_settings_teacherId_tierId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "teacher_package_tier_settings_teacherId_tierId_key" ON public.teacher_package_tier_settings USING btree ("teacherId", "tierId");


--
-- Name: teacher_profiles_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX teacher_profiles_slug_key ON public.teacher_profiles USING btree (slug);


--
-- Name: teacher_profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON public.teacher_profiles USING btree ("userId");


--
-- Name: teacher_qualifications_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "teacher_qualifications_teacherId_idx" ON public.teacher_qualifications USING btree ("teacherId");


--
-- Name: teacher_skills_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "teacher_skills_teacherId_idx" ON public.teacher_skills USING btree ("teacherId");


--
-- Name: teacher_work_experiences_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "teacher_work_experiences_teacherId_idx" ON public.teacher_work_experiences USING btree ("teacherId");


--
-- Name: teacher_work_experiences_teacherId_isCurrent_startDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "teacher_work_experiences_teacherId_isCurrent_startDate_idx" ON public.teacher_work_experiences USING btree ("teacherId", "isCurrent", "startDate");


--
-- Name: ticket_access_controls_ticketId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ticket_access_controls_ticketId_userId_key" ON public.ticket_access_controls USING btree ("ticketId", "userId");


--
-- Name: ticket_access_controls_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ticket_access_controls_userId_idx" ON public.ticket_access_controls USING btree ("userId");


--
-- Name: ticket_messages_authorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ticket_messages_authorId_idx" ON public.ticket_messages USING btree ("authorId");


--
-- Name: ticket_messages_ticketId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ticket_messages_ticketId_createdAt_idx" ON public.ticket_messages USING btree ("ticketId", "createdAt");


--
-- Name: ticket_status_history_ticketId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ticket_status_history_ticketId_createdAt_idx" ON public.ticket_status_history USING btree ("ticketId", "createdAt");


--
-- Name: transactions_readableId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "transactions_readableId_key" ON public.transactions USING btree ("readableId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phoneNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_phoneNumber_key" ON public.users USING btree ("phoneNumber");


--
-- Name: wallets_readableId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wallets_readableId_key" ON public.wallets USING btree ("readableId");


--
-- Name: wallets_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "wallets_userId_key" ON public.wallets USING btree ("userId");


--
-- Name: audit_logs audit_logs_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: availability_exceptions availability_exceptions_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_exceptions
    ADD CONSTRAINT "availability_exceptions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: availability availability_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability
    ADD CONSTRAINT "availability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bank_info bank_info_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_info
    ADD CONSTRAINT "bank_info_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_bookedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.children(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_studentUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: children children_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT "children_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: children children_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.parent_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: curriculum_subjects curriculum_subjects_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_subjects
    ADD CONSTRAINT "curriculum_subjects_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: curriculum_subjects curriculum_subjects_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curriculum_subjects
    ADD CONSTRAINT "curriculum_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: demo_sessions demo_sessions_demoOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demo_sessions
    ADD CONSTRAINT "demo_sessions_demoOwnerId_fkey" FOREIGN KEY ("demoOwnerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: demo_sessions demo_sessions_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demo_sessions
    ADD CONSTRAINT "demo_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disputes disputes_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT "disputes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disputes disputes_raisedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT "disputes_raisedByUserId_fkey" FOREIGN KEY ("raisedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disputes disputes_resolvedByAdminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT "disputes_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: disputes disputes_supportTicketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT "disputes_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: educational_stages educational_stages_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.educational_stages
    ADD CONSTRAINT "educational_stages_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: grade_levels grade_levels_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_levels
    ADD CONSTRAINT "grade_levels_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public.educational_stages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interview_time_slots interview_time_slots_teacherProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_time_slots
    ADD CONSTRAINT "interview_time_slots_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_redemptions package_redemptions_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_redemptions
    ADD CONSTRAINT "package_redemptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: package_redemptions package_redemptions_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_redemptions
    ADD CONSTRAINT "package_redemptions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.student_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: package_transactions package_transactions_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_transactions
    ADD CONSTRAINT "package_transactions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.student_packages(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parent_profiles parent_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profiles
    ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ratings ratings_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ratings ratings_ratedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_ratedByUserId_fkey" FOREIGN KEY ("ratedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ratings ratings_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reschedule_requests reschedule_requests_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reschedule_requests
    ADD CONSTRAINT "reschedule_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reschedule_requests reschedule_requests_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reschedule_requests
    ADD CONSTRAINT "reschedule_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reschedule_requests reschedule_requests_respondedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reschedule_requests
    ADD CONSTRAINT "reschedule_requests_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: saved_teachers saved_teachers_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_teachers
    ADD CONSTRAINT "saved_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saved_teachers saved_teachers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_teachers
    ADD CONSTRAINT "saved_teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_packages student_packages_payerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT "student_packages_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_packages student_packages_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT "student_packages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_packages student_packages_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT "student_packages_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_packages student_packages_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT "student_packages_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: student_packages student_packages_tierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_packages
    ADD CONSTRAINT "student_packages_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES public.package_tiers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_profiles student_profiles_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "student_profiles_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_profiles student_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_createdByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: support_tickets support_tickets_linkedBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_linkedBookingId_fkey" FOREIGN KEY ("linkedBookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_linkedStudentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_linkedStudentId_fkey" FOREIGN KEY ("linkedStudentId") REFERENCES public.student_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_linkedTeacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_linkedTeacherId_fkey" FOREIGN KEY ("linkedTeacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_resolvedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "support_tickets_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teacher_demo_settings teacher_demo_settings_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_demo_settings
    ADD CONSTRAINT "teacher_demo_settings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_package_tier_settings teacher_package_tier_settings_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_package_tier_settings
    ADD CONSTRAINT "teacher_package_tier_settings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_package_tier_settings teacher_package_tier_settings_tierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_package_tier_settings
    ADD CONSTRAINT "teacher_package_tier_settings_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES public.package_tiers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_profiles teacher_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT "teacher_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_qualifications teacher_qualifications_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_qualifications
    ADD CONSTRAINT "teacher_qualifications_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_skills teacher_skills_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_skills
    ADD CONSTRAINT "teacher_skills_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_subject_grades teacher_subject_grades_gradeLevelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject_grades
    ADD CONSTRAINT "teacher_subject_grades_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES public.grade_levels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_subject_grades teacher_subject_grades_teacherSubjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject_grades
    ADD CONSTRAINT "teacher_subject_grades_teacherSubjectId_fkey" FOREIGN KEY ("teacherSubjectId") REFERENCES public.teacher_subjects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_subjects teacher_subjects_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT "teacher_subjects_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teacher_subjects teacher_subjects_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teacher_subjects teacher_subjects_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_teaching_approach_tags teacher_teaching_approach_tags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_teaching_approach_tags
    ADD CONSTRAINT "teacher_teaching_approach_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.teaching_approach_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_teaching_approach_tags teacher_teaching_approach_tags_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_teaching_approach_tags
    ADD CONSTRAINT "teacher_teaching_approach_tags_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teacher_work_experiences teacher_work_experiences_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_work_experiences
    ADD CONSTRAINT "teacher_work_experiences_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public.teacher_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_access_controls ticket_access_controls_revokedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_access_controls
    ADD CONSTRAINT "ticket_access_controls_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ticket_access_controls ticket_access_controls_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_access_controls
    ADD CONSTRAINT "ticket_access_controls_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_access_controls ticket_access_controls_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_access_controls
    ADD CONSTRAINT "ticket_access_controls_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_messages ticket_messages_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT "ticket_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_messages ticket_messages_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_status_history ticket_status_history_changedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT "ticket_status_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_status_history ticket_status_history_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_status_history
    ADD CONSTRAINT "ticket_status_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_createdByAdminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wallets wallets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict B3g3IxRIAvb5hLWj6hSRhCEg3LzvNSnBarSflMp4WwxF2bDkwA9kJm9U1RQrcqa

