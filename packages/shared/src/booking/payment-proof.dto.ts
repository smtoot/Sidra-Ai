import { IsString, IsNotEmpty, IsUrl, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for parent/student to upload payment proof
 */
export class UploadPaymentProofDto {
    @IsString()
    @IsUrl({}, { message: 'Must be a valid payment proof image URL' })
    paymentProofUrl!: string;
}

/**
 * DTO for admin to review payment proof
 */
export class ReviewPaymentProofDto {
    @IsBoolean()
    approve!: boolean; // true = approve, false = reject

    @IsOptional()
    @IsString()
    rejectionNote?: string; // Required if approve=false
}
