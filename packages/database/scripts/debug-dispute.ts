
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Dispute Resolution...');

    // 1. Get the Dispute
    const disputes = await prisma.dispute.findMany({
        where: { id: '041c9286-caac-4906-be15-d2ac70655007' },
        include: { booking: { include: { teacherProfile: { include: { user: true } } } } }
    });

    if (disputes.length === 0) {
        console.error('❌ No dispute found');
        return;
    }
    const dispute = disputes[0];
    console.log(`✅ Found Dispute: ${dispute.id} (Status: ${dispute.status})`);
    console.log(`   Booking Price: ${dispute.booking.price}`);
    console.log(`   Commission: ${dispute.booking.commissionRate}`);

    // 2. Mock Logic Input
    const lockedAmountGross = Number(dispute.booking.price);
    const commissionRate = Number(dispute.booking.commissionRate);
    const parentUserId = dispute.booking.bookedByUserId;
    const teacherUserId = dispute.booking.teacherProfile.userId;

    console.log(`   Locked Amount: ${lockedAmountGross}`);
    console.log(`   Parent ID: ${parentUserId}`);
    console.log(`   Teacher User ID: ${teacherUserId}`);

    // 3. Wallets
    const parentWallet = await prisma.wallet.findUnique({ where: { userId: parentUserId } });
    const teacherWallet = await prisma.wallet.findUnique({ where: { userId: teacherUserId } });

    console.log('   Parent Wallet:', parentWallet ? `✅ Found (${parentWallet.balance} | Pending: ${parentWallet.pendingBalance})` : '❌ NOT FOUND');
    console.log('   Teacher Wallet:', teacherWallet ? `✅ Found (${teacherWallet.balance})` : '❌ NOT FOUND');

    if (!parentWallet || !teacherWallet) {
        console.error('❌ Wallet missing');
        return;
    }

    // 4. Calculations (TEACHER_WINS)
    const platformCommission = lockedAmountGross * commissionRate;
    const teacherPayoutNet = lockedAmountGross - platformCommission;

    console.log('   Calc (Teacher Wins):');
    console.log(`   Commission: ${platformCommission}`);
    console.log(`   Net Payout: ${teacherPayoutNet}`);
    console.log(`   Total Dist: ${platformCommission + teacherPayoutNet}`);

    // 5. Try Transaction logic (Dry Run)
    console.log('   Running Transaction simulation...');

    try {
        await prisma.$transaction(async (tx) => {
            // Update parent wallet
            // Check if pending balance covers it
            if (Number(parentWallet.pendingBalance) < lockedAmountGross) {
                console.warn(`WARNING: Parent pending balance ${parentWallet.pendingBalance} < locked amount ${lockedAmountGross}`);
            }

            // We won't actually commit, just test logic if possible, but actually we want to see if it crashes.
            // I will throw an error at the end to rollback.

            await tx.wallet.update({
                where: { id: parentWallet.id },
                data: { pendingBalance: { decrement: lockedAmountGross } }
            });
            console.log('   ✅ Wallet update simulated');

            await tx.transaction.create({
                data: {
                    walletId: parentWallet.id,
                    amount: lockedAmountGross,
                    type: 'ESCROW_RELEASE',
                    status: 'APPROVED',
                    adminNote: 'Debug test'
                }
            });
            console.log('   ✅ Transaction create simulated');

            // 6. Try Notification Logic
            await tx.notification.create({
                data: {
                    userId: parentUserId,
                    title: 'تحديث بخصوص النزاع',
                    message: 'Debug Message',
                    type: 'DISPUTE_UPDATE',
                    status: 'UNREAD'
                }
            });
            console.log('   ✅ Notification create simulated');

            throw new Error('ROLLBACK');
        });
    } catch (e: any) {
        if (e.message === 'ROLLBACK') {
            console.log('✅ Simulation completed without crash (Rolled back)');
        } else {
            console.error('❌ Transaction Failed:', e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
