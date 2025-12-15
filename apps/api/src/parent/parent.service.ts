
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ParentService {
    constructor(
        private prisma: PrismaService,
        private walletService: WalletService
    ) { }

    async getDashboardStats(userId: string) {
        const [wallet, upcomingClasses] = await Promise.all([
            this.walletService.getBalance(userId),
            this.prisma.booking.findMany({
                where: {
                    bookedByUserId: userId,
                    status: 'SCHEDULED'
                },
                orderBy: { startTime: 'asc' },
                take: 5, // Limit to next 5 upcoming classes
                include: {
                    teacherProfile: { include: { user: true } },
                    subject: true,
                    child: true // Include child name
                }
            })
        ]);

        return {
            balance: wallet.balance,
            upcomingClasses
        };
    }

    // --- Children Management ---

    async getChildren(userId: string) {
        const parentProfile = await this.prisma.parentProfile.findUnique({
            where: { userId },
            include: { children: true }
        });

        if (!parentProfile) throw new NotFoundException('Parent profile not found');
        return parentProfile.children;
    }

    async addChild(userId: string, data: { name: string; gradeLevel: string }) {
        console.log('addChild called for userId:', userId, 'with data:', data);
        const parentProfile = await this.prisma.parentProfile.findUnique({
            where: { userId }
        });
        console.log('parentProfile found:', parentProfile ? parentProfile.id : 'NOT FOUND');

        if (!parentProfile) throw new NotFoundException('Parent profile not found');

        return this.prisma.child.create({
            data: {
                parentId: parentProfile.id,
                name: data.name,
                gradeLevel: data.gradeLevel
            }
        });
    }

    async updateChild(userId: string, childId: string, data: { name?: string; gradeLevel?: string }) {
        // Verify ownership
        const child = await this.prisma.child.findFirst({
            where: {
                id: childId,
                parent: { userId }
            }
        });

        if (!child) throw new NotFoundException('Child not found or unauthorized');

        return this.prisma.child.update({
            where: { id: childId },
            data
        });
    }
}
