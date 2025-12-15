
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { UpdateTeacherProfileDto } from '@sidra/shared'; // Using shared DTO or need new one? 
// Actually we need a StudentProfileDto. For now, simplistic or reuse.
// The spec said "StudentProfile: 1:1 with User where role=STUDENT".

@Injectable()
export class StudentService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) { }

    async getDashboardStats(userId: string) {
        // Fetch bookings where bookedByUserId = userId
        const [wallet, upcomingClasses, totalClasses] = await Promise.all([
            this.walletService.getBalance(userId),
            this.prisma.booking.findMany({
                where: {
                    bookedByUserId: userId,
                    status: 'SCHEDULED'
                },
                orderBy: { startTime: 'asc' },
                take: 5, // Limit to next 5 upcoming classes
                include: { teacherProfile: { include: { user: true } }, subject: true }
            }),
            this.prisma.booking.count({
                where: { bookedByUserId: userId }
            })
        ]);

        return {
            balance: wallet.balance,
            upcomingClasses,
            totalClasses
        };
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.studentProfile.findUnique({
            where: { userId },
            include: { user: true }
        });
        if (!profile) throw new NotFoundException('Student profile not found');
        return profile;
    }

    // Assuming we might want update logic later
}
