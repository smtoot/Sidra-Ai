import { api } from '../api';

// Local type definitions (avoiding importing DTOs with decorators)
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT_LOCK' | 'PAYMENT_RELEASE' | 'REFUND';

export interface DepositRequest {
    amount: number;
    referenceImage: string;
}

export interface ProcessTransactionRequest {
    status: TransactionStatus;
    adminNote?: string;
}

export interface Transaction {
    id: string;
    amount: string;
    type: TransactionType;
    status: TransactionStatus;
    referenceImage?: string;
    createdAt: string;
}

export interface Wallet {
    id: string;
    balance: string;
    pendingBalance: string;
    currency: string;
    transactions: Transaction[];
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

    // Admin
    getAdminStats: async () => {
        const response = await api.get('/wallet/admin/stats');
        return response.data as {
            totalRevenue: number;
            pendingPayouts: { amount: number; count: number };
            totalPayouts: number;
        };
    },

    getPendingTransactions: async () => {
        const response = await api.get('/wallet/admin/pending');
        return response.data;
    },

    processTransaction: async (id: string, dto: ProcessTransactionRequest) => {
        const response = await api.patch(`/wallet/admin/transactions/${id}`, dto);
        return response.data;
    }
};
