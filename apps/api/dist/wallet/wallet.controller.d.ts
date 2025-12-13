import { WalletService } from './wallet.service';
import { DepositDto, ProcessTransactionDto } from '@sidra/shared';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getMyBalance(req: any): Promise<{
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
    deposit(req: any, dto: DepositDto): Promise<{
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
    processTransaction(id: string, dto: ProcessTransactionDto): Promise<{
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
}
