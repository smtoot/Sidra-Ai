import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID'
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    PAYMENT_LOCK = 'PAYMENT_LOCK',
    PAYMENT_RELEASE = 'PAYMENT_RELEASE',
    REFUND = 'REFUND',
    CANCELLATION_COMPENSATION = 'CANCELLATION_COMPENSATION',
    // P1 Addition: Package-related transaction types
    PACKAGE_PURCHASE = 'PACKAGE_PURCHASE',
    PACKAGE_RELEASE = 'PACKAGE_RELEASE',
    // P1 Addition: Escrow release for disputes
    ESCROW_RELEASE = 'ESCROW_RELEASE',
    // P1-1: Ledger completeness - track all balance mutations
    WITHDRAWAL_COMPLETED = 'WITHDRAWAL_COMPLETED',
    WITHDRAWAL_REFUNDED = 'WITHDRAWAL_REFUNDED',
    DEPOSIT_APPROVED = 'DEPOSIT_APPROVED'
}

export class DepositDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amount!: number;

    @IsString()
    // Note: This is a file key (e.g., "deposits/123.jpg"), not a URL
    referenceImage!: string;
}

export class ProcessTransactionDto {
    @IsEnum(TransactionStatus)
    status!: TransactionStatus;

    @IsOptional()
    @IsString()
    adminNote?: string;

    @IsOptional()
    @IsString()
    proofDocumentId?: string; // Added for MARK PAID

    @IsOptional()
    @IsString()
    referenceId?: string; // Mandatory for PAID, validated in service/controller
}

export class UpsertBankInfoDto {
    @IsString()
    bankName!: string;

    @IsOptional()
    @IsString()
    bankBranch?: string;

    @IsString()
    accountNumber!: string;

    @IsString()
    accountHolderName!: string;

    @IsOptional()
    @IsString()
    iban?: string;

    @IsOptional()
    @IsString()
    swiftCode?: string;
}

export class WithdrawalRequestDto {
    @Type(() => Number)
    @IsNumber()
    @Min(500, { message: 'Minimum withdrawal amount is 500 SDG' })
    amount!: number;
}
