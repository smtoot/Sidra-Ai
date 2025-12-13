import 'reflect-metadata';
export * from './src/auth/login.dto';
export * from './src/auth/register.dto';
export * from './src/marketplace/create-curriculum.dto';
export * from './src/marketplace/update-curriculum.dto';
export * from './src/marketplace/create-subject.dto';
export * from './src/marketplace/update-subject.dto';
export * from './src/marketplace/search.dto';
export * from './src/wallet/wallet.dto';
export * from './src/booking/booking.dto';
export * from './src/teacher/update-profile.dto';
export * from './src/teacher/teacher-subject.dto';
export * from './src/teacher/availability.dto';
export declare enum UserRole {
    PARENT = "PARENT",
    TEACHER = "TEACHER",
    ADMIN = "ADMIN",
    SUPPORT = "SUPPORT"
}
