"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@sidra/shared");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBalance(userId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: { userId },
                include: { transactions: true }
            });
        }
        return wallet;
    }
    async deposit(userId, dto) {
        const wallet = await this.getBalance(userId);
        return this.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: dto.amount,
                type: shared_1.TransactionType.DEPOSIT,
                status: shared_1.TransactionStatus.PENDING,
                referenceImage: dto.referenceImage
            }
        });
    }
    async getPendingTransactions() {
        return this.prisma.transaction.findMany({
            where: { status: shared_1.TransactionStatus.PENDING },
            include: {
                wallet: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    async processTransaction(transactionId, dto) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true }
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        if (transaction.status !== shared_1.TransactionStatus.PENDING) {
            throw new common_1.BadRequestException('Transaction already processed');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: dto.status,
                    adminNote: dto.adminNote
                }
            });
            if (dto.status === shared_1.TransactionStatus.APPROVED) {
                if (transaction.type === shared_1.TransactionType.DEPOSIT) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: { increment: transaction.amount }
                        }
                    });
                }
            }
            return updatedTx;
        });
    }
    async lockFundsForBooking(parentUserId, bookingId, amount) {
        const wallet = await this.getBalance(parentUserId);
        if (Number(wallet.balance) < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    pendingBalance: { increment: amount }
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: shared_1.TransactionType.PAYMENT_LOCK,
                    status: shared_1.TransactionStatus.APPROVED,
                    adminNote: `Funds locked for booking ${bookingId}`
                }
            });
        });
    }
    async releaseFundsOnCompletion(parentUserId, teacherUserId, bookingId, amount, commissionRate = 0.18) {
        const parentWallet = await this.getBalance(parentUserId);
        const teacherWallet = await this.getBalance(teacherUserId);
        const teacherEarnings = amount * (1 - commissionRate);
        const platformCommission = amount - teacherEarnings;
        return this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: parentWallet.id },
                data: {
                    pendingBalance: { decrement: amount }
                }
            });
            await tx.wallet.update({
                where: { id: teacherWallet.id },
                data: {
                    balance: { increment: teacherEarnings }
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: parentWallet.id,
                    amount: -amount,
                    type: shared_1.TransactionType.PAYMENT_RELEASE,
                    status: shared_1.TransactionStatus.APPROVED,
                    adminNote: `Payment for booking ${bookingId}`
                }
            });
            await tx.transaction.create({
                data: {
                    walletId: teacherWallet.id,
                    amount: teacherEarnings,
                    type: shared_1.TransactionType.PAYMENT_RELEASE,
                    status: shared_1.TransactionStatus.APPROVED,
                    adminNote: `Earnings from booking ${bookingId} (${(commissionRate * 100).toFixed(0)}% commission deducted)`
                }
            });
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map