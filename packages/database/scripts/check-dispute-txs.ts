
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const disputeId = '041c9286-caac-4906-be15-d2ac70655007';
    console.log(`🔍 Checking transactions for Dispute: ${disputeId}`);

    const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
            booking: {
                include: {
                    bookedByUser: { select: { email: true } },
                    teacherProfile: { include: { user: { select: { email: true } } } }
                }
            }
        }
    });

    if (!dispute) {
        console.log('❌ Dispute not found');
        return;
    }

    // Cast to any to avoid strict type checks for missing generated fields
    const d = dispute as any;
    console.log(`✅ Status: ${d.status}`);
    console.log(`   Resolution: ${d.resolution}`);
    console.log(`   Teacher Payout: ${d.teacherPayout}`);
    console.log(`   Student Refund: ${d.studentRefund}`);

    // Find transactions for Parent (Refunds/Escrow Release)
    const parentEmail = d.booking.bookedByUser.email;
    const parentWallet = await prisma.wallet.findFirst({ where: { user: { email: parentEmail } } });

    console.log(`\n👤 Parent Wallet (${parentEmail}):`);
    if (parentWallet) {
        const txs = await prisma.transaction.findMany({
            where: { walletId: parentWallet.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        txs.forEach(t => console.log(`   ${t.type} | ${t.amount} | ${t.adminNote || ''}`));
    }

    // Find transactions for Teacher (Payment Release)
    const teacherEmail = d.booking.teacherProfile.user.email;
    const teacherWallet = await prisma.wallet.findFirst({ where: { user: { email: teacherEmail } } });

    console.log(`\n👨‍🏫 Teacher Wallet (${teacherEmail}):`);
    if (teacherWallet) {
        const txs = await prisma.transaction.findMany({
            where: { walletId: teacherWallet.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        txs.forEach(t => console.log(`   ${t.type} | ${t.amount} | ${t.adminNote || ''}`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
