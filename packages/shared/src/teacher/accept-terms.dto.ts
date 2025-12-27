import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for accepting Terms & Conditions
 * Teachers must accept before submitting for review
 */
export class AcceptTermsDto {
  @IsString()
  @IsNotEmpty()
  termsVersion!: string; // e.g., "1.0", "2024-12-27"
}
