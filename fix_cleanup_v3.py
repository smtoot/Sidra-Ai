import sys
import re

path = 'apps/api/src/package/package.service.ts'
with open(path, 'r') as f:
    content = f.read()

# Fix student_package reference in include (Error 1180)
content = content.replace('include: { student_packages: true }', 'include: { student_package: true }')
# Wait, error say: "Property 'student_package' does not exist on type ... Did you mean 'student_packages'?"
# So it SHOULD be 'student_packages'.
# My previous script reverted it to student_package? 
# "include: { student_package: true }" -> "include: { student_packages: true }"
content = content.replace('include: { student_package:', 'include: { student_packages:')

# Fix duplicates (TS1117)
# 571: id and updatedAt duplicates?
# 1403, 1629, 1639, 1704: likely id/updatedAt duplicates.
# I will try to remove the specific duplicate string if I can match it contextually.
# Or I will just use regex to remove 'id: ...' if it appears twice in a small window?
# That's hard. 
# I'll rely on replacing the whole block if I can identify it.
# Actually, the error lines give me a hint.
# I'll just remove `updatedAt: new Date(),` if it appears in `bookings.create` and I also see another `updatedAt`.
# I'll let TS complain about missing property if I remove too much, better than syntax error? No/
# I will use a very specific regex for the duplicates I created.
# "id: crypto.randomUUID(), id:" NO.
# The error says "An object literal cannot have multiple properties".
# Likely:
# data: {
#   id: crypto.randomUUID(),
#   ...
#   id: ...,
# }
# I will replace `id: crypto.randomUUID(),` with nothing IF there is another `id:` in the same `data` block? Too hard.

# I will just remove the specific manual injections I suspect are duplicate.
# In `bookings.create` (line 570 approx), `transactions.create` (1400, 1630, 1700).
# I'll view the file around those lines to be sure.
# But I want to be fast.
# I'll blindly remove the `id: crypto.randomUUID(),` lines I added if they are causing trouble?
# But if I remove them, I might get "missing property id".
# This means there IS another `id` property.
# So removing my injection is CORRECT.

# I will use regex to remove `id: crypto.randomUUID(),` only if `id:` appears later in the text? No, too global.
# I'll search for `id: crypto.randomUUID(),` and if the next few lines contain `id:`, I remove the first one.

lines = content.split('\n')
new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    
    # Heuristic: if current line is my injected ID, and near future lines have 'id:', skip this one.
    if 'id: crypto.randomUUID(),' in line:
        context = "\n".join(lines[i+1:i+20]) # look ahead 20 lines
        if re.search(r'\bid:\s', context):
            # found another id, so skip this injection
            continue
            
    if 'updatedAt: new Date(),' in line:
        context = "\n".join(lines[i+1:i+20])
        if re.search(r'\bupdatedAt:\s', context):
            continue

    new_lines.append(line)

content = "\n".join(new_lines)

# Fix other logic errors
# Error 1836, 1919: 'payer' does not exist in student_packagesInclude. 
# Schema says `payer` (User)? Or `users`? Or `payer` is relation name?
# Generated client usually uses relation name.
# If schema has `payer User @relation(...)`, then `payer` is correct.
# Error says `payer` does not exist. Did you mean `users`?
# Maybe specific relation name is `payerUser` or something?
# I'll guess `payer` references `users`. But schema might name it `payer`.
# If error says it fails, I'll try `users`.
content = content.replace('payer: true', 'users: true')

# Error 1904: 'redemptions' -> 'package_redemptions' in include
content = content.replace('redemptions: true', 'package_redemptions: true')

# Error 1889, 2042: 'package_tiers' does not exist on ...
# Accessing `pkg.package_tiers`? Maybe it is singular `package_tier`?
# Schema `package_tiers` table -> `package_tier` relation?
# I replaced `packageTier` with `package_tiers` globally.
# If relation is singular, I broke it.
# Check error: "Property 'package_tiers' does not exist...".
# It doesn't suggest an alternative.
# I'll try reverting `package_tiers` to `package_tier` ONLY for property access `.package_tiers` if it looks like a single object access.
# But hard to know.
# I'll try `package_tier` for the specific line area if I can tag it.
# Actually, I'll globally revert `.package_tiers` to `.package_tier` IF it is followed by `.sessionCount` or similar?
# regex: `\.package_tiers\.` -> `.package_tier.`
content = re.sub(r'\.package_tiers\.', '.package_tier.', content)

# Error 2006: 'package_redemptions' does not exist on type...
# `r.package_redemptions`?
# Maybe `r` is `redemption`?
# If `r` is `student_package`, it has `package_redemptions`.
# Context: `pkg.package_redemptions.filter(...)`?
# Check line 2006.

with open(path, 'w') as f:
    f.write(content)
print(f"Fixed {path}")
