import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto, ProcessTransactionDto, TransactionStatus, TransactionType } from '@sidra/shared';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async getBalance(userId: string) {
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

    async deposit(userId: string, dto: DepositDto) {
        const wallet = await this.getBalance(userId);

        return this.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: dto.amount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.PENDING,
                referenceImage: dto.referenceImage
            }
        });
    }

    // --- Admin ---

    async getAdminStats() {
        const [totalDeposits, pendingWithdrawals, completedPayouts] = await Promise.all([
            // Total Deposits
            this.prisma.transaction.aggregate({
                where: { type: TransactionType.DEPOSIT, status: TransactionStatus.APPROVED },
                _sum: { amount: true }
            }),
            // Pending Withdrawals
            this.prisma.transaction.aggregate({
                where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.PENDING },
                _sum: { amount: true },
                _count: true
            }),
            // Completed Payouts
            this.prisma.transaction.aggregate({
                where: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.APPROVED },
                _sum: { amount: true }
            })
        ]);

        return {
            totalRevenue: totalDeposits._sum.amount || 0, // Proxy for now
            pendingPayouts: {
                amount: pendingWithdrawals._sum.amount || 0,
                count: pendingWithdrawals._count
            },
            totalPayouts: completedPayouts._sum.amount || 0
        };
    }

    async getPendingTransactions() {
        return this.prisma.transaction.findMany({
            where: { status: TransactionStatus.PENDING },
            include: {
                wallet: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async processTransaction(transactionId: string, dto: ProcessTransactionDto) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.status !== TransactionStatus.PENDING) {
            throw new BadRequestException('Transaction already processed');
        }

        // Atomic update
        return this.prisma.$transaction(async (tx) => {
            // Update Transaction
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: dto.status,
                    adminNote: dto.adminNote
                }
            });

            // Update Wallet Balance if Approved
            if (dto.status === TransactionStatus.APPROVED) {
                if (transaction.type === TransactionType.DEPOSIT) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: { increment: transaction.amount }
                        }
                    });
                } else if (transaction.type === TransactionType.WITHDRAWAL) {
                    // Reduce balance logic (usually done at request time differently, but here maybe confirm)
                    // If withdrawal request locks funds -> then here we just mark done.
                    // If withdrawal request didn't lock -> here we decrement.
                    // Assuming for MVP withdrawal request logic decrements 'available' and increments 'pending_withdraw'.
                    // Let's assume simplest: Withdrawal request JUST creates pending TX.
                    // So approval DECREMENTS balance.
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: { decrement: transaction.amount }
                        }
                    });
                }
            }
            // If Rejected Withdrawal, no balance change if it wasn't locked.

            return updatedTx;
        });
    }

    // --- Phase 2C: Booking Integration ---

    /**
     * Lock funds when booking is approved (WAITING_FOR_PAYMENT → SCHEDULED)
     * Moves funds from parent's balance to pendingBalance (escrow)
     */
    async lockFundsForBooking(parentUserId: string, bookingId: string, amount: number) {
        const wallet = await this.getBalance(parentUserId);

        if (Number(wallet.balance) < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        return this.prisma.$transaction(async (tx) => {
            // Move funds: balance → pendingBalance
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    pendingBalance: { increment: amount }
                }
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount,
                    type: TransactionType.PAYMENT_LOCK,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Funds locked for booking ${bookingId}`
                }
            });
        });
    }

    /**
     * Release funds when session is completed (SCHEDULED → COMPLETED)
     * Moves funds from parent's pending → teacher's balance (minus commission)
     */
    async releaseFundsOnCompletion(
        parentUserId: string,
        teacherUserId: string,
        bookingId: string,
        amount: number,
        commissionRate: number = 0.18
    ) {
        const parentWallet = await this.getBalance(parentUserId);
        const teacherWallet = await this.getBalance(teacherUserId);

        const teacherEarnings = amount * (1 - commissionRate);
        const platformCommission = amount - teacherEarnings;

        return this.prisma.$transaction(async (tx) => {
            // Parent: pending → 0 (release escrow)
            await tx.wallet.update({
                where: { id: parentWallet.id },
                data: {
                    pendingBalance: { decrement: amount }
                }
            });

            // Teacher: 0 → balance (receive payment minus commission)
            await tx.wallet.update({
                where: { id: teacherWallet.id },
                data: {
                    balance: { increment: teacherEarnings }
                }
            });

            // Record parent transaction (release from escrow)
            await tx.transaction.create({
                data: {
                    walletId: parentWallet.id,
                    amount: -amount,
                    type: TransactionType.PAYMENT_RELEASE,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Payment for booking ${bookingId}`
                }
            });

            // Record teacher transaction (earnings)
            await tx.transaction.create({
                data: {
                    walletId: teacherWallet.id,
                    amount: teacherEarnings,
                    type: TransactionType.PAYMENT_RELEASE,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Earnings from booking ${bookingId} (${(commissionRate * 100).toFixed(0)}% commission deducted)`
                }
            });

            // TODO: Record platform commission in a separate accounting table (Phase 3)
        });
    }
}
