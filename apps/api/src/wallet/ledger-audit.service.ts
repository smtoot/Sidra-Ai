import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface DiscrepancyDetail {
  walletId: string;
  readableId: string | null;
  userId: string;
  storedBalance: number;
  calculatedBalance: number;
  difference: number;
}

@Injectable()
export class LedgerAuditService {
  private readonly logger = new Logger(LedgerAuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run the ledger audit - verifies all wallet balances against transaction sums
   * Scheduled to run daily at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runScheduledAudit() {
    this.logger.log('Starting scheduled ledger audit...');
    await this.runAudit();
  }

  /**
   * Manually trigger an audit (for admin use)
   */
  async runAudit(): Promise<{
    id: string;
    status: string;
    discrepancyCount: number;
  }> {
    const startTime = Date.now();
    const discrepancies: DiscrepancyDetail[] = [];

    try {
      // Get all wallets
      const wallets = await this.prisma.wallets.findMany({
        select: {
          id: true,
          readableId: true,
          userId: true,
          balance: true,
        },
      });

      const totalWallets = wallets.length;
      let walletsChecked = 0;

      for (const wallet of wallets) {
        // Calculate expected balance from transactions
        const calculatedBalance = await this.calculateWalletBalance(wallet.id);
        const storedBalance = Number(wallet.balance);

        // Compare (allow for small floating point differences)
        const difference = Math.abs(storedBalance - calculatedBalance);

        if (difference > 0.01) {
          // More than 1 cent difference
          discrepancies.push({
            walletId: wallet.id,
            readableId: wallet.readableId,
            userId: wallet.userId,
            storedBalance,
            calculatedBalance,
            difference: storedBalance - calculatedBalance,
          });
        }

        walletsChecked++;
      }

      const durationMs = Date.now() - startTime;
      const status = discrepancies.length > 0 ? 'DISCREPANCY_FOUND' : 'SUCCESS';

      // Store audit result
      const auditLog = await this.prisma.ledger_audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          totalWallets,
          walletsChecked,
          discrepancyCount: discrepancies.length,
          status,
          durationMs,
          details:
            discrepancies.length > 0
              ? JSON.parse(JSON.stringify(discrepancies))
              : undefined,
        },
      });

      if (discrepancies.length > 0) {
        this.logger.warn(
          `Ledger audit completed with ${discrepancies.length} discrepancies found!`,
        );
      } else {
        this.logger.log(
          `Ledger audit completed successfully. ${walletsChecked} wallets balanced.`,
        );
      }

      return {
        id: auditLog.id,
        status: auditLog.status,
        discrepancyCount: auditLog.discrepancyCount,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // Store error result
      await this.prisma.ledger_audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          totalWallets: 0,
          walletsChecked: 0,
          discrepancyCount: 0,
          status: 'ERROR',
          durationMs,
          details: { error: error.message },
        },
      });

      this.logger.error(`Ledger audit failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate expected wallet balance from all transactions
   */
  private async calculateWalletBalance(walletId: string): Promise<number> {
    // Get all APPROVED transactions for this wallet
    const transactions = await this.prisma.transactions.findMany({
      where: {
        walletId,
        status: 'APPROVED',
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let balance = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount);

      // Add or subtract based on transaction type
      // Types that INCREASE wallet balance:
      // - DEPOSIT, DEPOSIT_APPROVED: Money added
      // - REFUND: Refunded amount
      // - PAYMENT_RELEASE, PACKAGE_RELEASE, ESCROW_RELEASE: Teacher receiving payment
      // - WITHDRAWAL_REFUNDED: Failed withdrawal returned
      // - CANCELLATION_COMPENSATION: Compensation for cancelled session
      //
      // Types that DECREASE wallet balance:
      // - WITHDRAWAL, WITHDRAWAL_COMPLETED: Money taken out
      // - PAYMENT_LOCK, PACKAGE_PURCHASE: Funds locked/paid

      switch (tx.type) {
        case 'DEPOSIT':
        case 'DEPOSIT_APPROVED':
        case 'REFUND':
        case 'PAYMENT_RELEASE':
        case 'PACKAGE_RELEASE':
        case 'ESCROW_RELEASE':
        case 'WITHDRAWAL_REFUNDED':
        case 'CANCELLATION_COMPENSATION':
          balance += amount;
          break;
        case 'WITHDRAWAL':
        case 'WITHDRAWAL_COMPLETED':
        case 'PAYMENT_LOCK':
        case 'PACKAGE_PURCHASE':
          balance -= amount;
          break;
        default:
          this.logger.warn(`Unknown transaction type: ${tx.type}`);
      }
    }

    return Math.round(balance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get recent audit logs for admin dashboard
   */
  async getRecentAudits(limit: number = 10) {
    return this.prisma.ledger_audit_logs.findMany({
      orderBy: { runAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get a specific audit log with details
   */
  async getAuditById(id: string) {
    return this.prisma.ledger_audit_logs.findUnique({
      where: { id },
    });
  }

  /**
   * Mark a discrepancy as resolved
   */
  async resolveAudit(id: string, userId: string, note: string) {
    return this.prisma.ledger_audit_logs.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedByUserId: userId,
        resolutionNote: note,
      },
    });
  }
}
