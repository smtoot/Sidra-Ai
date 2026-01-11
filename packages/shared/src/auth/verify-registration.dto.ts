import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyRegistrationDto {
    @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
    @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
    @Matches(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط' })
    otp!: string;
}
