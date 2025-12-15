
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [
            totalUsers,
            totalTeachers,
            totalStudents,
            totalBookings,
            pendingBookings,
            totalRevenue // This might be complex, let's just count completed bookings for now or sum transaction fees
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'TEACHER' } }),
            this.prisma.user.count({ where: { role: 'PARENT' } }), // Assuming Parent is Student for now
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { status: 'PENDING_TEACHER_APPROVAL' } }),
            this.prisma.transaction.aggregate({
                where: { type: 'PAYMENT_RELEASE' }, // Assuming commission is taken here? Or usage of DEPOSIT?
                // For MVP, let's just show total Wallet Balances (system liability) or Total Deposits.
                // Let's use Total Deposits for "Volume".
                _sum: { amount: true }
            })
        ]);

        // Recent Activity (Simple: Latest 5 users)
        const recentUsers = await this.prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { teacherProfile: true }
        });

        return {
            counts: {
                users: totalUsers,
                teachers: totalTeachers,
                students: totalStudents,
                bookings: totalBookings,
                pendingBookings: pendingBookings
            },
            financials: {
                totalVolume: totalRevenue._sum.amount || 0
            },
            recentUsers
        };
    }
}
