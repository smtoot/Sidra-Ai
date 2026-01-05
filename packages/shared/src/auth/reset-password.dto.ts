import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty({ message: 'الرمز مطلوب' })
    token!: string;

    @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
    @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'كلمة المرور ضعيفة' })
    newPassword!: string;
}
