import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendOtpDto {
    @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string;
}
