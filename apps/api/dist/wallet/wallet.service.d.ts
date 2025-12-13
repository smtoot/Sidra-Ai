import { PrismaService } from '../prisma/prisma.service';
import { DepositDto, ProcessTransactionDto } from '@sidra/shared';
export declare class WalletService {
    private prisma;
    constructor(prisma: PrismaService);
    getBalance(userId: string): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            walletId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            type: import("@prisma/client").$Enums.TransactionType;
            status: import("@prisma/client").$Enums.TransactionStatus;
            referenceImage: string | null;
            adminNote: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        pendingBalance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    deposit(userId: string, dto: DepositDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        walletId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        referenceImage: string | null;
        adminNote: string | null;
    }>;
    getPendingTransactions(): Promise<({
        wallet: {
            user: {
                id: string;
                email: string;
                passwordHash: string;
                role: import("@prisma/client").$Enums.UserRole;
                phoneNumber: string | null;
                isActive: boolean;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            pendingBalance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        walletId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        referenceImage: string | null;
        adminNote: string | null;
    })[]>;
    processTransaction(transactionId: string, dto: ProcessTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        walletId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.TransactionType;
        status: import("@prisma/client").$Enums.TransactionStatus;
        referenceImage: string | null;
        adminNote: string | null;
    }>;
    lockFundsForBooking(parentUserId: string, bookingId: string, amount: number): Promise<void>;
    releaseFundsOnCompletion(parentUserId: string, teacherUserId: string, bookingId: string, amount: number, commissionRate?: number): Promise<void>;
}
