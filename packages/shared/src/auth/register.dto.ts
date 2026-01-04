import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export enum UserRole {
    PARENT = 'PARENT',
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    CONTENT_ADMIN = 'CONTENT_ADMIN',
    FINANCE = 'FINANCE',
    SUPPORT = 'SUPPORT',
}

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string; // Email is now required

    @IsString()
    @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
    phoneNumber!: string; // Phone remains required

    @IsString()
    @IsStrongPassword() // P1-5: Strong password policy (12+ chars, uppercase, lowercase, number, special char)
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;

    // firstName is required for PARENT and STUDENT only
    @ValidateIf(o => o.role === UserRole.PARENT || o.role === UserRole.STUDENT)
    @IsString()
    @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;
}
