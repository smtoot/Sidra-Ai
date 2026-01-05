import sys
import re

path = 'apps/api/src/package/package.service.ts'

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Detect dangling properties that imply a missing wrapper line
    
    # 1. Bookings (Line ~579)
    # Looks like: `                bookedByUserId: studentId,`
    # Check context to ensure it's not already wrapped
    if 'bookedByUserId: studentId,' in line and 'bookings.create' not in lines[i-1]:
        # Insert missing booking create
        new_lines.append('            const booking = await tx.bookings.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),\n')
    
    # 2. Transactions (Refund) ~1410
    # `                readableId: refundTxId,`
    # Check if this is the refund transaction
    elif 'readableId: refundTxId,' in line and 'transactions.create' not in lines[i-1]:
        new_lines.append('            await tx.transactions.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),\n')
        
    # 3. Transactions (Cancel Refund) ~1643
    # `                readableId: refundTxId,` 
    # Same signature as above, contextually distinct?
    # If I see `readableId: refundTxId` again, I append the same wrapper.
    # It seems safe to use the same wrapper for both refund cases.
    
    # 4. Transactions (Expire) ~1720
    # `                readableId: txId,`
    # If `txId` is used.
    elif 'readableId: txId,' in line and 'transactions.create' not in lines[i-1]:
         new_lines.append('            await tx.transactions.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),\n')

    # 5. Package Transactions ~1442 & ~1749
    # `                idempotencyKey,` (shorthand?) or `idempotencyKey: ...`
    # Warning: Lint said "No value exists in scope for shorthand property 'idempotencyKey'".
    # Maybe it was `idempotencyKey: idempotencyKey`?
    # Lint said "Cannot find name 'idempotencyKey'".
    # Let's assume the body is:
    #             readableId...,
    #             packageId...,
    #             amount...,
    # If I match on `type: 'REFUND',` or similar?
    # Package transactions don't have 'REFUND' type usually? 
    # Let's match `packageId: pkg.id,` AND `amount:` on next lines?
    # Or strict match on what was dangling.
    # Line 1442 error: `idempotencyKey` expected.
    # The dangling line might be `idempotencyKey: whatever`.
    # Let's fallback to looking for `packageId: pkg.id` inside a block that lost its header.
    # But `packageId: pkg.id` is common.
    # Let's look for `type: 'USAGE_REVOKED'` or `type: 'EXPIRED'`.
    
    elif "type: 'USAGE_REVOKED'," in line and 'package_transactions.create' not in lines[i-1] and 'package_transactions.create' not in lines[i-2]:
         new_lines.append('          await tx.package_transactions.create({ data: { id: crypto.randomUUID(),\n')

    elif "type: 'EXPIRED'," in line and 'package_transactions.create' not in lines[i-1] and 'package_transactions.create' not in lines[i-2]:
         new_lines.append('          await tx.package_transactions.create({ data: { id: crypto.randomUUID(),\n')

    # 6. Bookings (Reschedule/Schedule) ~2196
    # `bookedByUserId: userId` (instead of studentId)
    # `beneficiaryType: 'STUDENT'`
    elif "bookedByUserId: userId," in line and "beneficiaryType: 'STUDENT'," in lines[i+1]:
         # This is likely the schedule booking one
         if 'bookings.create' not in lines[i-1]:
             new_lines.append('      const booking = await tx.bookings.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),\n')

    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print(f"Fixed {path}")
