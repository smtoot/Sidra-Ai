import sys
import re

path = 'apps/api/src/package/package.service.ts'

with open(path, 'r') as f:
    content = f.read()

# Fix duplicates
# Pattern: id: crypto.randomUUID(), updatedAt: new Date(), ...... id:
# We'll just remove the PREPENDED one if there's another one later in the block?
# Hard to detect block.
# Assuming I just added it.
# I will use a regex to merge adjacent duplicates if possible.
# But regex won't match across lines easily with '.*'.
# I'll just search for specific doubles I might have created.
# "id: crypto.randomUUID(), updatedAt: new Date(), id:" (if on same line or close)
content = re.sub(r'id: crypto\.randomUUID\(\),\s*updatedAt: new Date\(\),\s*id:', 'id:', content)
content = re.sub(r'id: crypto\.randomUUID\(\),\s*id:', 'id:', content)
# Check for "id: crypto... readableId: ..., id:" type patterns.
# I'll rely on the fact that I prepended.
# If I see `id: crypto..., ... id:`, I should remove the first part?
# Too risky blindly.
# I will fix the specific lines from TS1117.
# 571, 1403, 1630, 1640, 1705.
# These likely have `id` already.
# I'll attempt to replace `id: crypto.randomUUID(), updatedAt: new Date(),` with EMPTY STRING if followed by `id:` later? No.
# I'll just remove the lines I added if they look like duplicates.
# Actually I'll use `replace` for these specific signatures.

# Fix student_package -> student_packages
content = content.replace('student_package:', 'student_packages:')

# Fix packageRedemption -> package_redemptions
content = content.replace('packageRedemption', 'package_redemptions')

# Fix payer -> users (speculative)
# content = content.replace('payer:', 'users:') # risky.

# Fix user -> users (lines 314)
content = content.replace('user: {', 'users: {')

with open(path, 'w') as f:
    f.write(content)
print(f"Fixed {path}")
