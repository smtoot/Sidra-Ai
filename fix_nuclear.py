import sys
import re
import os

path = 'apps/api/src/package/package.service.ts'

with open(path, 'r') as f:
    content = f.read()

# Nuclear injection of ID and updatedAt into ALL create calls
# Matches: .create({ data: {
# Replaces with: .create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),
# We use a negative lookahead to avoid double injection if possible, or just let it be (tsc will complain if duplicate keys? no, last wins or error. Duplicate key error in validation?)
# Safer to check if `id:` is already there?
# Regex: `\.create\(\{\s*data:\s*\{(?!.*id:)` is hard across lines.
# I will just inject. TS will complain if duplicate property, but better than missing.
# If I inject at start `data: { id: ...`, and existing `id: ...` is later, existing overwrites (in JS execution) or TS error "duplicate identifier"?
# TS error "Duplicate identifier 'id'".
# So I must be careful.
# Most errors say "Property 'id' is missing".
# I acts on `bookings.create`, `transactions.create`, `wallets.create`, `student_packages.create` etc.

# I will use specific targets based on lint output line numbers approximately or context.
# Or just inject and if duplicate, I'll fix duplicates.
# Actually, duplicate keys in object literal is syntax error in strict mode? No. "An object literal cannot have multiple properties with the same name" in strict TS? Yes.
# So I should not inject if `id:` exists.

# I will use a simple regex that checks for `id:` in the next 50 chars? No.
# I will just target the specific ones that failed.

fix_list = [
    # Bookings (lines 578, 1129, 2196)
    (r'(tx|this\.prisma)\.bookings\.create\(\{\s*data:\s*\{', r'\1.bookings.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),
    
    # Transactions (Refunds/Purchase)
    (r'(tx|this\.prisma)\.transactions\.create\(\{\s*data:\s*\{', r'\1.transactions.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),
    
    # Package Transactions
    (r'(tx|this\.prisma)\.package_transactions\.create\(\{\s*data:\s*\{', r'\1.package_transactions.create({ data: { id: crypto.randomUUID(),'), # updatedAt not required?
    
    # Student Packages
    (r'(tx|this\.prisma)\.student_packages\.create\(\{\s*data:\s*\{', r'\1.student_packages.create({ data: { id: crypto.randomUUID(),'),
    
    # Package Redemptions
    (r'(tx|this\.prisma)\.package_redemptions\.create\(\{\s*data:\s*\{', r'\1.package_redemptions.create({ data: { id: crypto.randomUUID(),'),
    
    # Wallets
    (r'(tx|this\.prisma)\.wallets\.create\(\{\s*data:\s*\{', r'\1.wallets.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),

    # Teacher Demo Settings
    (r'(tx|this\.prisma)\.teacher_demo_settings\.create\(\{\s*data:\s*\{', r'\1.teacher_demo_settings.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),

    # Teacher Tier Settings
    (r'(tx|this\.prisma)\.teacher_package_tier_settings\.create\(\{\s*data:\s*\{', r'\1.teacher_package_tier_settings.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),
    
    # Package Tiers
    (r'(tx|this\.prisma)\.package_tiers\.create\(\{\s*data:\s*\{', r'\1.package_tiers.create({ data: { id: crypto.randomUUID(), updatedAt: new Date(),'),

    # Revert packageRedemption -> package_redemptions
    (r'\.packageRedemption\b', '.package_redemptions'),
    (r'packageRedemption:\s*\{', 'package_redemptions: {'),

    # Fix redemptions property access on bookings/student_packages (Error 1897, 1925, 2028, 2056)
    # Lint says 'redemptions' does not exist.
    # Logic uses `.redemptions`.
    # I should change `.redemptions` to `.package_redemptions`.
    (r'\.redemptions\b', '.package_redemptions'),
    (r'redemptions:\s*true', 'package_redemptions: true'),
]

for pattern, replacement in fix_list:
    content = re.sub(pattern, replacement, content)

# Remove double injections if any "id: ..., id: ..." or "updatedAt: ..., updatedAt: ..."
# Regex to clean up: `id: crypto.randomUUID(),\s*id:` -> `id:`
# This is tricky without parsing.
# I'll rely on correct targeting.

with open(path, 'w') as f:
    f.write(content)
print(f"Fixed {path}")
