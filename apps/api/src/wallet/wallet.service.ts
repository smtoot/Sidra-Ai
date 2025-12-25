import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto, ProcessTransactionDto, TransactionStatus, TransactionType, UpsertBankInfoDto, WithdrawalRequestDto } from '@sidra/shared';
// import { AuditAction } from '@prisma/client'; // Removed due to export issues in local env // Assuming AuditAction is in shared, or verify location.
// If AuditAction is not in shared, I might need to import from prisma schema or define it.
// Checking schema, AuditAction is an enum. Prisma enums are usually exported from @prisma/client.
// Let's import AuditAction from @prisma/client usually, but let's check imports.
// The file imports TransactionStatus from @sidra/shared, which re-exports or defines it. 
// Let's check if I can import AuditAction from @prisma/client or just use string for now to avoid compilation error if shared doesn't have it.
// Better: import { AuditAction } from '@prisma/client';
import { AuditAction, Prisma } from '@prisma/client';

import { NotificationService } from '../notification/notification.service';
import { normalizeMoney } from '../utils/money';
import { ReadableIdService } from '../common/readable-id/readable-id.service';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private readableIdService: ReadableIdService
    ) { }

    async getBalance(userId: string, tx?: Prisma.TransactionClient) {
        const prisma = tx || this.prisma;
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!wallet) {
            const readableId = await this.readableIdService.generate('WALLET');
            wallet = await prisma.wallet.create({
                data: { userId, readableId },
                include: { transactions: true }
            });
        }

        // Fetch Bank Info for status check (Masked)
        const profile = await prisma.teacherProfile.findUnique({
            where: { userId },
            include: { bankInfo: true }
        });

        return {
            ...wallet,
            bankInfo: profile?.bankInfo ? {
                bankName: profile.bankInfo.bankName,
                accountHolder: profile.bankInfo.accountHolderName,
                accountNumberMasked: `***${profile.bankInfo.accountNumber.slice(-4)}`,
                ibanMasked: profile.bankInfo.iban ? `***${profile.bankInfo.iban.slice(-4)}` : undefined
            } : null
        };
    }

    async deposit(userId: string, dto: DepositDto) {
        const wallet = await this.getBalance(userId);

        const readableId = await this.readableIdService.generate('TRANSACTION');
        return this.prisma.transaction.create({
            data: {
                readableId,
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

    async getAdminTransactions(
        status?: TransactionStatus,
        type?: TransactionType,
        userId?: string,
        startDate?: Date,
        endDate?: Date,
        page: number = 1,
        limit: number = 50
    ) {
        const where: Prisma.TransactionWhereInput = {};

        if (status && status !== ('ALL' as any)) where.status = status;
        if (type && type !== ('ALL' as any)) where.type = type;
        if (userId) where.wallet = { userId };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                include: {
                    wallet: {
                        include: { user: { include: { teacherProfile: { include: { bankInfo: true } } } } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip
            }),
            this.prisma.transaction.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getAdminUserWallet(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Last 50 transactions for context
                }
            }
        });

        if (!wallet) throw new NotFoundException('User wallet not found');

        return wallet;
    }

    async getAdminTransaction(id: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                wallet: {
                    include: {
                        user: {
                            include: {
                                teacherProfile: {
                                    include: {
                                        bankInfo: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    async processTransaction(transactionId: string, dto: ProcessTransactionDto) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');

        // Prevent re-processing finalized transactions
        if (transaction.status === TransactionStatus.PAID || transaction.status === TransactionStatus.REJECTED) {
            throw new BadRequestException('Transaction already finalized');
        }

        // Atomic update
        return this.prisma.$transaction(async (tx) => {
            // Update Transaction Status
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: dto.status as any,
                    adminNote: dto.adminNote,
                    proofDocumentId: dto.proofDocumentId,
                    referenceId: dto.referenceId,
                    paidAt: dto.status === TransactionStatus.PAID ? new Date() : undefined
                }
            });

            // Logic for Withdrawal:
            if (transaction.type === TransactionType.WITHDRAWAL) {
                // APPROVE: No balance change (Funds stay in Pending)
                // PAID: Burn Pending Balance (Funds leave system)
                if (dto.status === TransactionStatus.PAID) {

                    // Validate Reference ID for PAID status
                    if (!dto.referenceId) {
                        throw new BadRequestException('Receipt Number (Reference ID) is mandatory for confirming payment');
                    }

                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            pendingBalance: { decrement: transaction.amount }
                        }
                    });

                    // Notify User
                    await this.notificationService.notifyUser({
                        userId: transaction.wallet.userId,
                        title: 'تم إيداع الأرباح',
                        message: `تم إيداع مبلغ ${transaction.amount} SDG في حسابك البنكي.`,
                        type: 'PAYMENT_RELEASED' // Reuse existing type or add new one? PAYMENT_RELEASED seems fit.
                    });
                }
                // REJECT: Refund (Pending -> Balance)
                else if (dto.status === TransactionStatus.REJECTED) {
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            pendingBalance: { decrement: transaction.amount },
                            balance: { increment: transaction.amount }
                        }
                    });
                }
            }
            // Logic for Deposit:
            else if (transaction.type === TransactionType.DEPOSIT) {
                if (dto.status === TransactionStatus.APPROVED && transaction.status === TransactionStatus.PENDING) {
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

    // --- Phase 2C: Booking Integration ---

    /**
     * Lock funds when booking is approved (WAITING_FOR_PAYMENT → SCHEDULED)
     * Moves funds from parent's balance to pendingBalance (escrow)
     */
    async lockFundsForBooking(parentUserId: string, bookingId: string, amount: number, tx?: Prisma.TransactionClient) {
        // MONEY NORMALIZATION: Ensure amount is integer
        const normalizedAmount = normalizeMoney(amount);

        // Use provided transaction or default to this.prisma
        const prisma = tx || this.prisma;

        // Cannot use getBalance inside transaction as it might create a wallet outside transaction if not careful.
        // For now, let's assume wallet exists or find it transactionally.
        // Re-implement getBalance logic inline or make getBalance accept tx?
        // Making getBalance accept tx is safer.
        const wallet = await this.getBalance(parentUserId, prisma);

        if (Number(wallet.balance) < normalizedAmount) {
            throw new BadRequestException('Insufficient balance');
        }

        const operation = async (transaction: Prisma.TransactionClient) => {
            // SECURITY: Conditional update prevents race condition - only update if balance sufficient
            const updateResult = await transaction.wallet.updateMany({
                where: {
                    id: wallet.id,
                    balance: { gte: normalizedAmount } // Only update if balance >= amount
                },
                data: {
                    balance: { decrement: normalizedAmount },
                    pendingBalance: { increment: normalizedAmount }
                }
            });

            // If no rows updated, balance was insufficient (race condition occurred)
            if (updateResult.count === 0) {
                throw new BadRequestException('Insufficient balance (concurrent request detected)');
            }

            // Create transaction record
            const readableId = await this.readableIdService.generate('TRANSACTION');
            const txRecord = await transaction.transaction.create({
                data: {
                    readableId,
                    walletId: wallet.id,
                    amount: normalizedAmount, // MONEY NORMALIZATION: Stored as integer
                    type: TransactionType.PAYMENT_LOCK,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Funds locked for booking ${bookingId}`
                }
            });

            this.logger.log(`💰 LOCK | bookingId=${bookingId} | txId=${txRecord.id} | amount=${normalizedAmount} | walletId=${wallet.id}`);
        };

        if (tx) {
            return operation(tx);
        } else {
            return this.prisma.$transaction(operation);
        }
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
        commissionRate: number = 0.18,
        tx?: Prisma.TransactionClient
    ) {
        const prisma = tx || this.prisma;
        const parentWallet = await this.getBalance(parentUserId, prisma);
        const teacherWallet = await this.getBalance(teacherUserId, prisma);

        // SAFEGUARD: Validate pending balance before decrementing
        if (Number(parentWallet.pendingBalance) < amount) {
            throw new BadRequestException(`Insufficient pending balance. Available: ${parentWallet.pendingBalance}, Required: ${amount}`);
        }

        // MONEY NORMALIZATION: Calculate earnings as integer
        // Platform receives remainder (no separate rounding) to ensure exact sum
        const normalizedAmount = normalizeMoney(amount);
        const teacherEarnings = normalizeMoney(normalizedAmount * (1 - commissionRate));
        const platformCommission = normalizedAmount - teacherEarnings; // No separate rounding

        const operation = async (transaction: Prisma.TransactionClient) => {
            // Parent: pending → 0 (release escrow)
            await transaction.wallet.update({
                where: { id: parentWallet.id },
                data: {
                    pendingBalance: { decrement: normalizedAmount } // MONEY NORMALIZATION
                }
            });

            // Teacher: 0 → balance (receive payment minus commission)
            await transaction.wallet.update({
                where: { id: teacherWallet.id },
                data: {
                    balance: { increment: teacherEarnings } // Already normalized
                }
            });

            // Record parent transaction (release from escrow)
            const parentTxReadableId = await this.readableIdService.generate('TRANSACTION');
            const parentTxRecord = await transaction.transaction.create({
                data: {
                    readableId: parentTxReadableId,
                    walletId: parentWallet.id,
                    amount: normalizedAmount, // MONEY NORMALIZATION: Stored as integer
                    type: TransactionType.PAYMENT_RELEASE,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Payment for booking ${bookingId}`
                }
            });

            // Record teacher transaction (earnings)
            const teacherTxReadableId = await this.readableIdService.generate('TRANSACTION');
            const teacherTxRecord = await transaction.transaction.create({
                data: {
                    readableId: teacherTxReadableId,
                    walletId: teacherWallet.id,
                    amount: teacherEarnings, // MONEY NORMALIZATION: Already integer
                    type: TransactionType.PAYMENT_RELEASE,
                    status: TransactionStatus.APPROVED,
                    adminNote: `Earnings from booking ${bookingId} (${(commissionRate * 100).toFixed(0)}% commission deducted)`
                }
            });

            this.logger.log(`💸 RELEASE | bookingId=${bookingId} | parentTxId=${parentTxRecord.id} | teacherTxId=${teacherTxRecord.id} | amount=${normalizedAmount} | teacherEarnings=${teacherEarnings}`);

            // TODO: Record platform commission in a separate accounting table (Phase 3)
        };

        if (tx) {
            return operation(tx);
        } else {
            return this.prisma.$transaction(operation);
        }
    }

    /**
     * Settle funds when booking is cancelled
     * Moves funds from parent's pendingBalance:
     * - refundAmount → parent's balance (refund)
     * - teacherCompAmount → teacher's balance (cancellation compensation)
     * 
     * All operations are atomic within a single transaction.
     */
    async settleCancellation(
        parentUserId: string,
        teacherUserId: string,
        bookingId: string,
        totalLockedAmount: number,
        refundAmount: number,
        teacherCompAmount: number,
        tx?: Prisma.TransactionClient
    ) {
        const prisma = tx || this.prisma;
        const parentWallet = await this.getBalance(parentUserId, prisma);
        const teacherWallet = await this.getBalance(teacherUserId, prisma);

        // Validate the amounts add up
        if (Math.abs((refundAmount + teacherCompAmount) - totalLockedAmount) > 0.01) {
            throw new BadRequestException('Refund + teacher compensation must equal locked amount');
        }

        // SAFEGUARD: Validate pending balance before decrementing
        if (Number(parentWallet.pendingBalance) < totalLockedAmount) {
            throw new BadRequestException(`Insufficient pending balance. Available: ${parentWallet.pendingBalance}, Required: ${totalLockedAmount}`);
        }

        const operation = async (transaction: Prisma.TransactionClient) => {
            // 1. Decrement parent's pendingBalance (release all locked funds)
            await transaction.wallet.update({
                where: { id: parentWallet.id },
                data: {
                    pendingBalance: { decrement: totalLockedAmount }
                }
            });

            // 2. Credit refund to parent's balance (if any)
            if (refundAmount > 0) {
                await transaction.wallet.update({
                    where: { id: parentWallet.id },
                    data: {
                        balance: { increment: refundAmount }
                    }
                });

                // Record parent refund transaction
                const refundTxId = await this.readableIdService.generate('TRANSACTION');
                await transaction.transaction.create({
                    data: {
                        readableId: refundTxId,
                        walletId: parentWallet.id,
                        amount: refundAmount,
                        type: TransactionType.REFUND,
                        status: TransactionStatus.APPROVED,
                        adminNote: `Refund for cancelled booking ${bookingId}`
                    }
                });
            }

            // 3. Credit compensation to teacher's balance (if any)
            if (teacherCompAmount > 0) {
                await transaction.wallet.update({
                    where: { id: teacherWallet.id },
                    data: {
                        balance: { increment: teacherCompAmount }
                    }
                });

                // Record teacher compensation transaction
                const compTxId = await this.readableIdService.generate('TRANSACTION');
                await transaction.transaction.create({
                    data: {
                        readableId: compTxId,
                        walletId: teacherWallet.id,
                        amount: teacherCompAmount,
                        type: TransactionType.CANCELLATION_COMPENSATION,
                        status: TransactionStatus.APPROVED,
                        adminNote: `Cancellation compensation for booking ${bookingId}`
                    }
                });
            }
        };

        if (tx) {
            return operation(tx);
        } else {
            return this.prisma.$transaction(operation);
        }
    }

    // --- Phase 3: Teacher Withdrawals ---

    async upsertBankInfo(userId: string, dto: UpsertBankInfoDto) {
        // 1. Get Teacher Profile
        const teacher = await this.prisma.teacherProfile.findUnique({
            where: { userId },
            include: { bankInfo: true }
        });

        if (!teacher) {
            throw new NotFoundException('Teacher profile not found');
        }

        // 2. Security: Validate IBAN/Swift (Basic regex for MVP, strict validation can be added)
        // For strictness, let's at least check length if provided
        if (dto.iban && dto.iban.length < 15) throw new BadRequestException('Invalid IBAN format');

        // 3. Audit Logging (Redact full numbers)
        const redactedOld = teacher.bankInfo ? {
            ...teacher.bankInfo,
            accountNumber: `***${teacher.bankInfo.accountNumber.slice(-4)}`,
            iban: teacher.bankInfo.iban ? `***${teacher.bankInfo.iban.slice(-4)}` : undefined
        } : null;

        const redactedNew = {
            ...dto,
            accountNumber: `***${dto.accountNumber.slice(-4)}`,
            iban: dto.iban ? `***${dto.iban.slice(-4)}` : undefined
        };

        return this.prisma.$transaction(async (tx) => {
            // Upsert Bank Info
            const bankInfo = await tx.bankInfo.upsert({
                where: { teacherId: teacher.id },
                create: {
                    teacherId: teacher.id,
                    ...dto
                },
                update: {
                    ...dto
                }
            });

            // Log Audit
            await tx.auditLog.create({
                data: {
                    action: 'SETTINGS_UPDATE' as any, // Cast to any to avoid enum issues
                    actorId: userId,
                    targetId: teacher.id,
                    payload: {
                        field: 'bankInfo',
                        old: redactedOld,
                        new: redactedNew
                    }
                }
            });

            return bankInfo;
        });
    }

    async requestWithdrawal(userId: string, dto: WithdrawalRequestDto) {
        const wallet = await this.getBalance(userId);
        const { amount } = dto;

        // 1. Validate Amount
        if (Number(wallet.balance) < amount) {
            throw new BadRequestException('Insufficient available balance');
        }

        // 2. Get Bank Info for Snapshot
        const teacher = await this.prisma.teacherProfile.findUnique({
            where: { userId },
            include: { bankInfo: true }
        });

        if (!teacher?.bankInfo) {
            throw new BadRequestException('Bank info required for withdrawal');
        }
        const bank = teacher.bankInfo;

        // 3. Store Full Snapshot (Unmasked for Admin Payouts)
        const bankSnapshot = {
            bankName: bank.bankName,
            accountHolder: bank.accountHolderName,
            accountNumber: bank.accountNumber, // Storing UNMASKED for admin
            accountNumberMasked: `***${bank.accountNumber.slice(-4)}`,
            iban: bank.iban, // Storing UNMASKED for admin
            ibanMasked: bank.iban ? `***${bank.iban.slice(-4)}` : undefined,
            swift: bank.swiftCode,
            bankBranch: bank.bankBranch, // Include Branch
            bankInfoId: bank.id,
            snapshotDate: new Date().toISOString()
        };

        // 4. Atomic Execution
        return this.prisma.$transaction(async (tx) => {
            // A. ONE-OPEN-RULE: Check for active withdrawals
            // (Even with DB index, checking explicitly gives better error message)
            const activeWithdrawal = await tx.transaction.findFirst({
                where: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] }
                }
            });

            if (activeWithdrawal) {
                throw new BadRequestException('You have an active withdrawal request. Please wait for it to be processed.');
            }

            // B. Conditional Wallet Update (Concurrency Guard)
            // Move funds from Balance -> PendingBalance
            const updateResult = await tx.wallet.updateMany({
                where: {
                    id: wallet.id,
                    balance: { gte: amount } // Conditional Check
                },
                data: {
                    balance: { decrement: amount },
                    pendingBalance: { increment: amount }
                }
            });

            if (updateResult.count === 0) {
                throw new BadRequestException('Insufficient balance or concurrent transaction failure');
            }

            // C. Create Transaction Record
            const readableId = await this.readableIdService.generate('TRANSACTION');
            return tx.transaction.create({
                data: {
                    readableId,
                    walletId: wallet.id,
                    amount,
                    type: TransactionType.WITHDRAWAL,
                    status: TransactionStatus.PENDING,
                    bankSnapshot: bankSnapshot
                } as any
            });
        });
    }
}
