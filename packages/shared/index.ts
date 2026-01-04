import 'reflect-metadata';
// Auth
export * from './src/auth/login.dto';
export * from './src/auth/register.dto';

// Marketplace
export * from './src/marketplace/create-curriculum.dto';
export * from './src/marketplace/update-curriculum.dto';
export * from './src/marketplace/create-subject.dto';
export * from './src/marketplace/update-subject.dto';
export * from './src/marketplace/search.dto';

// Wallet
export * from './src/wallet/wallet.dto';

// Booking
export * from './src/booking/booking.dto';
export * from './src/booking/complete-session.dto';

// Teacher
export * from './src/teacher/update-profile.dto';
export * from './src/teacher/teacher-subject.dto';
export * from './src/teacher/availability.dto';
export * from './src/teacher/exception.dto';
export * from './src/teacher/propose-interview-slots.dto';
export * from './src/teacher/accept-terms.dto';
export * from './src/teacher/qualification.dto';
export * from './src/teacher/vacation-mode.dto';
export * from './src/teacher/skill.dto';
export * from './src/teacher/work-experience.dto';

// Package (Smart Pack)
export * from './src/package';

// Support Ticket
export * from './src/support-ticket';

// Utils
export * from './src/utils/display-name.util';

// Validators
export * from './src/validators/password.validator';

// Enums
export * from './src/enums';

// Common
export * from './src/common/pagination';

// Analytics
export * from './src/analytics-events';


// Global enums
export enum UserRole {
    PARENT = 'PARENT',
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    CONTENT_ADMIN = 'CONTENT_ADMIN',
    FINANCE = 'FINANCE',
    SUPPORT = 'SUPPORT'
}

export enum ApplicationStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    CHANGES_REQUESTED = 'CHANGES_REQUESTED',
    INTERVIEW_REQUIRED = 'INTERVIEW_REQUIRED',
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

