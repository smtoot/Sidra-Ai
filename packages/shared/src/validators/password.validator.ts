import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * P1-5: Strong password validator
 * Requires:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    // Minimum length: 12 characters
                    if (value.length < 12) {
                        return false;
                    }

                    // At least one uppercase letter
                    if (!/[A-Z]/.test(value)) {
                        return false;
                    }

                    // At least one lowercase letter
                    if (!/[a-z]/.test(value)) {
                        return false;
                    }

                    // At least one number
                    if (!/[0-9]/.test(value)) {
                        return false;
                    }

                    // At least one special character
                    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                        return false;
                    }

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'كلمة المرور يجب أن تحتوي على 12 حرفاً على الأقل، وتشمل حرف كبير، حرف صغير، رقم، ورمز خاص (!@#$%^&* إلخ)';
                }
            }
        });
    };
}
