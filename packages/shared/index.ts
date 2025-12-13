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

// Teacher
export * from './src/teacher/update-profile.dto';
export * from './src/teacher/teacher-subject.dto';
export * from './src/teacher/availability.dto';

// Global enums
export enum UserRole {
    PARENT = 'PARENT',
    TEACHER = 'TEACHER',
    ADMIN = 'ADMIN',
    SUPPORT = 'SUPPORT'
}
