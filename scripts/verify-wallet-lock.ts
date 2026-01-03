import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Emulate Wallet Service Logic
async function lockFundsForBooking(
    walletId: string,
    amount: number,
    userId: string,
    bookingId: string
) {
    // 1. Transaction wrapping (mimic service)
    return prisma.$transaction(async (tx) => {
        // 2. The Critical Security Logic from WalletService
        const updateResult = await tx.wallet.updateMany({
            where: {
                id: walletId,
                balance: { gte: amount }, // 🔒 Only update if balance >= amount
            },
            data: {
                balance: { decrement: amount },
                pendingBalance: { increment: amount },
            },
        });

        if (updateResult.count === 0) {
            throw new Error('Insufficient balance (concurrent request detected)');
        }

        // 3. Create Transaction Record
        await tx.transaction.create({
            data: {
                readableId: `TX-TEST-${Date.now()}-${Math.random()}`,
                walletId: walletId,
                amount: amount,
                type: 'PAYMENT_LOCK',
                status: 'APPROVED',
                adminNote: `Funds locked for booking ${bookingId}`,
            },
        });
    }, {
        isolationLevel: 'Serializable' // MATCHING SERVICE CONFIG
    });
}

async function main() {
    console.log('🚀 Starting Wallet Concurrency Test (Standalone)...');

    // 1. Setup: Create Parent & Teacher
    const parentEmail = `parent-test-${Date.now()}@example.com`;
    const teacherEmail = `teacher-test-${Date.now()}@example.com`;

    const parent = await prisma.user.create({
        data: {
            email: parentEmail,
            role: 'PARENT',
            passwordHash: 'mock',
            phoneNumber: `+249${Math.floor(Math.random() * 1000000000)}`,
            wallet: {
                create: {
                    balance: 100, // Initial Balance: 100 SDG
                    pendingBalance: 0,
                    readableId: `W-PARENT-${Date.now()}`
                }
            }
        },
        include: { wallet: true }
    });

    const teacher = await prisma.user.create({
        data: {
            email: teacherEmail,
            role: 'TEACHER',
            passwordHash: 'mock',
            phoneNumber: `+249${Math.floor(Math.random() * 1000000000)}`,
            teacherProfile: {
                create: {
                    displayName: 'Test Teacher',
                    slug: `teacher-${Date.now()}`,
                    subjects: {
                        create: {
                            pricePerHour: 30,
                            subject: { create: { nameAr: 'Math', nameEn: 'Math' } },
                            curriculum: { create: { nameAr: 'Local', nameEn: 'Local', code: 'LOC' } }
                        }
                    }
                }
            }
        },
        include: { teacherProfile: true }
    });

    // Type assertion or check
    if (!parent.wallet) throw new Error('Parent wallet not created');
    const initialBalance = new Prisma.Decimal(parent.wallet.balance).toNumber();
    console.log(`✅ Setup Complete. Parent Wallet Balance: ${initialBalance} SDG`);

    // 2. Stress Test: Attempt 5 concurrent bookings (Cost 30 each)
    // Total cost needed: 150. Available: 100. Should fail 2.
    const attempts = 5;
    const price = 30;
    console.log(`⚡ Launching ${attempts} concurrent booking locks (Price: ${price} SDG each)...`);

    const results = await Promise.allSettled(
        Array(attempts).fill(0).map(async (_, i) => {
            const bookingId = `booking-test-${i}-${Date.now()}`;
            try {
                await lockFundsForBooking(parent.wallet!.id, price, parent.id, bookingId);
                console.log(`✅ Request ${i + 1}: LOCKED successfully`);
                return true;
            } catch (error: any) {
                console.log(`❌ Request ${i + 1}: FAILED (${error.message})`);
                throw error;
            }
        })
    );

    // 3. Verify Final State
    const finalWallet = await prisma.wallet.findUnique({ where: { id: parent.wallet.id } });

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    const finalBalance = finalWallet ? new Prisma.Decimal(finalWallet.balance).toNumber() : -1;
    const finalPending = finalWallet ? new Prisma.Decimal(finalWallet.pendingBalance).toNumber() : -1;

    console.log('\n📊 Results:');
    console.log(`Successful Locks: ${successCount}`);
    console.log(`Failed Locks: ${failCount}`);
    console.log(`Final Balance: ${finalBalance} (Expected: 10)`);
    console.log(`Final Pending: ${finalPending} (Expected: 90)`);

    if (successCount === 3 && finalBalance === 10) {
        console.log('✅ TEST PASSED: Double spend prevented.');
    } else {
        console.error('🛑 TEST FAILED: Locking logic allows double spend or incorrect calculation.');
        // Don't fail the script immediately to allow cleanup/observation, but log error
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
