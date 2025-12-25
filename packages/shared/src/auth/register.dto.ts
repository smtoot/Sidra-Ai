import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export enum UserRole {
    PARENT = 'PARENT',
    TEACHER = 'TEACHER',
    ADMIN = 'ADMIN',
    SUPPORT = 'SUPPORT',
    STUDENT = 'STUDENT',
}

export class RegisterDto {
    @IsEmail()
    @IsOptional() // Phone-first: email is optional
    email?: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber!: string; // Phone-first: phone is required

    @IsString()
    @MinLength(8)
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
