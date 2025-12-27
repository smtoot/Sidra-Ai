import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Password validator
 * Requires:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
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

                    // Minimum length: 8 characters
                    if (value.length < 8) {
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

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرف كبير، حرف صغير، ورقم';
                }
            }
        });
    };
}

