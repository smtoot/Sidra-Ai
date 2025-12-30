import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type IdType = 'BOOKING' | 'TRANSACTION' | 'PACKAGE' | 'WALLET' | 'TICKET';

/**
 * Service for generating human-readable sequential IDs
 * Uses database-level locking to ensure concurrency safety
 */
@Injectable()
export class ReadableIdService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a booking ID: BK-YYMM-NNNN
   */
  async generateBookingId(): Promise<string> {
    const yearMonth = this.getCurrentYearMonth();
    const counter = await this.getNextCounter('BOOKING', yearMonth);
    return `BK-${yearMonth}-${this.padNumber(counter, 4)}`;
  }

  /**
   * Generate a transaction ID: TXN-YYMM-NNNN
   */
  async generateTransactionId(): Promise<string> {
    const yearMonth = this.getCurrentYearMonth();
    const counter = await this.getNextCounter('TRANSACTION', yearMonth);
    return `TXN-${yearMonth}-${this.padNumber(counter, 4)}`;
  }

  /**
   * Generate a package ID: PKG-YYMM-NNNN
   */
  async generatePackageId(): Promise<string> {
    const yearMonth = this.getCurrentYearMonth();
    const counter = await this.getNextCounter('PACKAGE', yearMonth);
    return `PKG-${yearMonth}-${this.padNumber(counter, 4)}`;
  }

  /**
   * Generate a wallet ID: WAL-NNNNNN (global, no monthly reset)
   */
  async generateWalletId(): Promise<string> {
    const counter = await this.getNextCounter('WALLET', null);
    return `WAL-${this.padNumber(counter, 6)}`;
  }

  /**
   * Generate a ticket ID: TKT-YYMM-NNNN
   */
  async generateTicketId(): Promise<string> {
    const yearMonth = this.getCurrentYearMonth();
    const counter = await this.getNextCounter('TICKET', yearMonth);
    return `TKT-${yearMonth}-${this.padNumber(counter, 4)}`;
  }

  /**
   * Get next counter with database-level locking for concurrency safety
   */
  private async getNextCounter(
    type: IdType,
    yearMonth: string | null,
  ): Promise<number> {
    // Use a transaction with row-level locking
    return this.prisma.$transaction(async (tx) => {
      // Try to find existing counter
      const existing = await tx.readableIdCounter.findUnique({
        where: {
          type_yearMonth: {
            type,
            yearMonth: yearMonth ?? '',
          },
        },
      });

      if (existing) {
        // Increment and return
        const updated = await tx.readableIdCounter.update({
          where: { id: existing.id },
          data: { counter: { increment: 1 } },
        });
        return updated.counter;
      } else {
        // Create new counter starting at 1
        const created = await tx.readableIdCounter.create({
          data: {
            type,
            yearMonth: yearMonth ?? '',
            counter: 1,
          },
        });
        return created.counter;
      }
    });
  }

  /**
   * Get current year-month in YYMM format
   */
  private getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }

  /**
   * Pad number with leading zeros
   */
  private padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }
}
