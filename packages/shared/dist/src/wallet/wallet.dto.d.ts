export declare enum TransactionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    PAYMENT_LOCK = "PAYMENT_LOCK",
    PAYMENT_RELEASE = "PAYMENT_RELEASE",
    REFUND = "REFUND"
}
export declare class DepositDto {
    amount: number;
    referenceImage: string;
}
export declare class ProcessTransactionDto {
    status: TransactionStatus;
    adminNote?: string;
}
