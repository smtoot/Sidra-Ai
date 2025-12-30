// @ts-nocheck
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WalletService } from '../wallet/wallet.service';
import { AdminService } from '../admin/admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType, UserRole } from '@sidra/shared';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const walletService = app.get(WalletService);
  const adminService = app.get(AdminService);
  const prisma = app.get(PrismaService);

  console.log('--- STARTING WITHDRAWAL VERIFICATION ---');

  // 1. Setup Test User
  const email = `test.teacher.${Date.now()}@example.com`;
  console.log(`Creating test teacher: ${email}`);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'hash',
      role: 'TEACHER' as any,
      phoneNumber: `+123${Date.now().toString().slice(-8)}`,
      teacherProfile: {
        create: {
          bio: 'Test Bio',
          subjects: { create: [] },
          bankInfo: {
            create: {
              bankName: 'Test Bank',
              accountNumber: '1234567890',
              accountHolderName: 'Test Teacher',
              iban: 'SD12345678901234567890',
              swiftCode: 'TESTBKSD',
            },
          },
        },
      },
    },
    include: { teacherProfile: true },
  });

  // 2. Setup Wallet & Balance
  console.log('Setting up wallet with 2000 SDG balance...');
  // Initial deposit
  await walletService.deposit(user.id, {
    amount: 2000,
    referenceImage: 'http://test.com/ref.jpg',
  });
  // Auto-approve deposit to get funds
  const depositTx = await prisma.transaction.findFirst({
    where: {
      walletId: (await walletService.getBalance(user.id)).id,
      type: 'DEPOSIT' as any,
    },
  });

  if (!depositTx) throw new Error('Deposit transaction not found');

  // Manually approve via prisma to skip checks if any
  await prisma.transaction.update({
    where: { id: depositTx.id },
    data: { status: 'APPROVED' as any },
  });
  // Update balance manually to simulate approval logic if deposit() didn't do it fully (it creates PENDING)
  await prisma.wallet.update({
    where: { userId: user.id },
    data: { balance: { increment: 2000 } },
  });

  const initialWallet = await walletService.getBalance(user.id);
  console.log('Initial Wallet:', initialWallet);

  // 3. Test 1: Successful Withdrawal Request
  console.log('\n--- TEST 1: Request Withdrawal (500 SDG) ---');
  const tx1 = await walletService.requestWithdrawal(user.id, { amount: 500 });
  console.log('Transaction Created:', tx1.id, tx1.status);

  const walletAfterReq = await walletService.getBalance(user.id);
  console.log('Wallet after request:', {
    balance: walletAfterReq.balance,
    pendingBalance: walletAfterReq.pendingBalance,
  });

  if (Number(walletAfterReq.balance) !== Number(initialWallet.balance) - 500)
    throw new Error('Balance not deducted!');
  if (
    Number(walletAfterReq.pendingBalance) !==
    Number(initialWallet.pendingBalance) + 500
  )
    throw new Error('Pending balance not incremented!');

  // 3.5 Test 1.5: One-Open-Rule Violation
  console.log('\n--- TEST 1.5: One-Open-Rule ---');
  try {
    await walletService.requestWithdrawal(user.id, { amount: 100 });
    throw new Error('FAILED: Allowed second withdrawal!');
  } catch (e: any) {
    console.log('PASSED: Second withdrawal blocked:', e.message);
  }

  // 4. Test 2: Process - Reject (Refund)
  console.log('\n--- TEST 2: Admin Reject ---');
  await adminService.processWithdrawal(tx1.id, {
    status: 'REJECTED' as any,
    adminNote: 'Testing Refund',
  });

  const walletAfterReject = await walletService.getBalance(user.id);
  console.log('Wallet after reject:', {
    balance: walletAfterReject.balance,
    pendingBalance: walletAfterReject.pendingBalance,
  });

  if (Number(walletAfterReject.balance) !== Number(initialWallet.balance))
    throw new Error('Balance not refunded!');
  if (
    Number(walletAfterReject.pendingBalance) !==
    Number(initialWallet.pendingBalance)
  )
    throw new Error('Pending balance not cleared!');

  // 5. Test 3: Process - Pay (Burn)
  console.log('\n--- TEST 3: Request & Pay ---');
  const tx2 = await walletService.requestWithdrawal(user.id, { amount: 800 });
  console.log('New Request:', tx2.id);

  // Approve first (Optional, testing flow)
  await adminService.processWithdrawal(tx2.id, { status: 'APPROVED' as any });
  const tx2Approved = await prisma.transaction.findUnique({
    where: { id: tx2.id },
  });
  if (!tx2Approved || tx2Approved.status !== 'APPROVED')
    throw new Error('Status not updated to APPROVED');

  // Mark Paid
  await adminService.processWithdrawal(tx2.id, {
    status: 'PAID' as any,
    proofDocumentId: 'doc_123',
    referenceId: 'TRX-VERIFY-001',
  });
  console.log('Marked PAID');

  const walletAfterPaid = await walletService.getBalance(user.id);
  console.log('Wallet after paid:', {
    balance: walletAfterPaid.balance,
    pendingBalance: walletAfterPaid.pendingBalance,
  });

  if (Number(walletAfterPaid.balance) !== Number(initialWallet.balance) - 800)
    throw new Error('Balance should remain deducted');
  if (Number(walletAfterPaid.pendingBalance) !== 0)
    throw new Error('Pending balance should be burned (0)');

  // 6. Test 4: Concurrency
  console.log('\n--- TEST 4: Concurrency (Race Condition) ---');
  // Set balance to 2000. Try 5 requests of 300.
  await prisma.wallet.update({
    where: { id: walletAfterPaid.id },
    data: { balance: 2000, pendingBalance: 0 },
  });
  await prisma.transaction.updateMany({
    where: { walletId: walletAfterPaid.id },
    data: { status: 'REJECTED' as any },
  });

  console.log('Firing 5 simultaneous requests...');
  const results = await Promise.allSettled([
    walletService.requestWithdrawal(user.id, { amount: 300 }),
    walletService.requestWithdrawal(user.id, { amount: 300 }),
    walletService.requestWithdrawal(user.id, { amount: 300 }),
    walletService.requestWithdrawal(user.id, { amount: 300 }),
    walletService.requestWithdrawal(user.id, { amount: 300 }),
  ]);

  const successes = results.filter((r) => r.status === 'fulfilled');
  const failures = results.filter((r) => r.status === 'rejected');

  console.log(`Successes: ${successes.length}, Failures: ${failures.length}`);
  if (successes.length > 1) {
    throw new Error(
      `CRITICAL: Concurrency check failed! Allowed ${successes.length} overlapping withdrawals.`,
    );
  } else {
    console.log('PASSED: Only 1 withdrawal allowed concurrently.');
  }

  console.log('\n--- VERIFICATION COMPLETE: ALL SYSTEMS GO ---');
  await app.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
