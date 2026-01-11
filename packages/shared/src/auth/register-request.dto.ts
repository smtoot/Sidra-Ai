import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export enum UserRole {
    PARENT = 'PARENT',
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
}

export class RegisterRequestDto {
    @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
    phoneNumber!: string;

    @IsString()
    @IsStrongPassword()
    password!: string;

    @IsEnum(UserRole, { message: 'نوع الحساب غير صحيح' })
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
