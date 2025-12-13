import { IsString, IsNumber, Min, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    PAYMENT_LOCK = 'PAYMENT_LOCK',
    PAYMENT_RELEASE = 'PAYMENT_RELEASE',
    REFUND = 'REFUND'
}

export class DepositDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Min(10000000, { message: 'Maximum deposit amount is 10,000,000 SDG' })
    amount!: number;

    @IsString()
    @IsUrl({}, { message: 'Must be a valid receipt image URL' })
    referenceImage!: string;
}

export class ProcessTransactionDto {
    @IsEnum(TransactionStatus)
    status!: TransactionStatus;

    @IsOptional()
    @IsString()
    adminNote?: string;
}
