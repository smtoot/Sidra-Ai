import { Matches, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    // @ts-ignore
    @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, { message: 'البريد الإلكتروني غير صالح' })
    @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
    email!: string;
}
