import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail()
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string;
}
