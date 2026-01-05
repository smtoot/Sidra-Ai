import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReadableIdService {
  private readonly logger = new Logger(ReadableIdService.name);

  constructor(private prisma: PrismaService) {}

  async generate(
    type: 'BOOKING' | 'TRANSACTION' | 'PACKAGE' | 'WALLET',
    date?: Date,
  ): Promise<string> {
    const prefixMap = {
      BOOKING: 'BK',
      TRANSACTION: 'TX',
      PACKAGE: 'PKG',
      WALLET: 'WAL',
    };

    const prefix = prefixMap[type];

    if (type === 'WALLET') {
      const yearMonth = 'GLOBAL';
      return this.generateSequentialId(type, yearMonth, prefix, 6);
    } else {
      const d = date || new Date();
      const yearMonth = `${(d.getFullYear() % 100).toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return this.generateSequentialId(
        type,
        yearMonth,
        `${prefix}-${yearMonth}`,
        4,
      );
    }
  }

  private async generateSequentialId(
    type: any,
    yearMonth: string,
    prefix: string,
    padding: number,
  ): Promise<string> {
    // Find or create counter
    // Note: upsert in Prisma is not atomic for concurrent increment if we read first, but here we can just update.
    // If it doesn't exist, we must create it.
    // We try to update first, if fails (row not found), we create.

    try {
      // Optimistic update: assume it exists
      const counter = await this.prisma.readable_id_counters.update({
        where: { type_yearMonth: { type, yearMonth } },
        data: { counter: { increment: 1 } },
      });
      return `${prefix}-${counter.counter.toString().padStart(padding, '0')}`;
    } catch (error) {
      // If it doesn't exist, create it. Handle race condition with another try-catch or upsert.
      try {
        const counter = await this.prisma.readable_id_counters.create({
          data: {
            id: 'cnt_' + crypto.randomUUID(),
            type,
            yearMonth,
            counter: 1,
            updatedAt: new Date(),
          },
        });
        return `${prefix}-${counter.counter.toString().padStart(padding, '0')}`;
      } catch (createError) {
        // If create fails, it means it was created concurrently, so update again.
        const counter = await this.prisma.readable_id_counters.update({
          where: { type_yearMonth: { type, yearMonth } },
          data: { counter: { increment: 1 } },
        });
        return `${prefix}-${counter.counter.toString().padStart(padding, '0')}`;
      }
    }
  }
}
