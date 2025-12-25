import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class LoginDto {
    @IsEmail()
    @IsOptional()
    @ValidateIf((o) => !o.phoneNumber) // Require email if phone not provided
    @MaxLength(255)
    email?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => !o.email) // Require phone if email not provided
    phoneNumber?: string; // Phone-first: preferred login method

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    password!: string;
}
