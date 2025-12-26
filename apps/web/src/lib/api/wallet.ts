import { api } from '../api';

// Local type definitions (avoiding importing DTOs with decorators)
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
export type TransactionType =
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'PAYMENT_LOCK'
    | 'PAYMENT_RELEASE'
    | 'REFUND'
    | 'CANCELLATION_COMPENSATION'
    | 'PACKAGE_PURCHASE'
    | 'PACKAGE_RELEASE'
    | 'ESCROW_RELEASE'
    | 'WITHDRAWAL_COMPLETED'
    | 'WITHDRAWAL_REFUNDED'
    | 'DEPOSIT_APPROVED';

export interface DepositRequest {
    amount: number;
    referenceImage: string;
}

export interface ProcessTransactionRequest {
    status: TransactionStatus;
    adminNote?: string;
    referenceId?: string;
    proofDocumentId?: string;
}

export interface Transaction {
    id: string;
    readableId?: string; // e.g. "TX-2412-1234"
    amount: string;
    type: TransactionType;
    status: TransactionStatus;
    referenceImage?: string;
    referenceId?: string;
    proofDocumentId?: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
}

export interface UpsertBankInfoDto {
    bankName: string;
    bankBranch?: string;
    accountNumber: string;
    accountHolderName: string;
    iban?: string;
    swiftCode?: string;
}

export interface WithdrawalRequestDto {
    amount: number;
}

export interface BankInfo {
    bankName: string;
    accountHolder: string;
    accountNumberMasked: string;
    ibanMasked?: string;
}

export interface Wallet {
    id: string;
    readableId?: string; // e.g. "WAL-1234"
    balance: string;
    pendingBalance: string;
    currency: string;
    transactions: Transaction[];
    bankInfo?: BankInfo | null;
}

export const walletApi = {
    getMyBalance: async (): Promise<Wallet> => {
        const response = await api.get('/wallet/me');
        return response.data;
    },

    deposit: async (data: DepositRequest) => {
        const response = await api.post('/wallet/deposit', data);
        return response.data;
    },

    upsertBankInfo: async (data: UpsertBankInfoDto) => {
        const response = await api.post('/wallet/bank-info', data);
        return response.data;
    },

    requestWithdrawal: async (data: WithdrawalRequestDto) => {
        const response = await api.post('/wallet/withdraw', data);
        return response.data;
    },

    // Admin
    getAdminStats: async () => {
        const response = await api.get('/wallet/admin/stats');
        return response.data as {
            totalRevenue: number;
            pendingPayouts: { amount: number; count: number };
            totalPayouts: number;
        };
    },

    getTransactions: async (params?: {
        status?: TransactionStatus;
        type?: TransactionType;
        userId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/wallet/admin/transactions', { params });
        return response.data as {
            data: (Transaction & { wallet: { user: { email: string; teacherProfile?: { displayName: string } } } })[];
            meta: { total: number; page: number; limit: number; totalPages: number };
        };
    },

    getUserWallet: async (userId: string) => {
        const response = await api.get(`/wallet/admin/users/${userId}/wallet`);
        return response.data as Wallet;
    },

    getTransaction: async (id: string): Promise<Transaction & { wallet: any; bankSnapshot?: any }> => {
        const response = await api.get(`/wallet/admin/transactions/${id}`);
        return response.data;
    },

    processTransaction: async (id: string, dto: ProcessTransactionRequest) => {
        const response = await api.patch(`/wallet/admin/transactions/${id}`, dto);
        return response.data;
    }
};
