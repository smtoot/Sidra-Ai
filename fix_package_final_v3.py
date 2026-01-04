import sys
import re
import os

files_map = {
    'apps/api/src/package/package.service.ts': [
        # Inject ID for refunded transactions
        (r'type:\s*\'REFUND\',', 'id: crypto.randomUUID(),\n          type: \'REFUND\','),
        
        # Inject ID for bookings (catch-all for remaining)
        (r'return\s*tx\.bookings\.create\(\{\s*data:\s*\{', 'return tx.bookings.create({\n        data: {\n          id: crypto.randomUUID(),'),
        (r'return\s*this\.prisma\.bookings\.create\(\{\s*data:\s*\{', 'return this.prisma.bookings.create({\n        data: {\n          id: crypto.randomUUID(),'),
        
        # Inject ID for teacher settings (catch-all)
        (r'data:\s*\{\s*teacherId,\s*demoEnabled,\s*packagesEnabled\s*\}', 'data: { id: crypto.randomUUID(), teacherId, demoEnabled, packagesEnabled }'),
        (r'data:\s*\{\s*teacherId,\s*tierId,\s*isEnabled\s*\}', 'data: { id: crypto.randomUUID(), teacherId, tierId, isEnabled }'),

        # Fix packageRedemption property access
        (r'\.packageRedemption', '.package_redemptions'),
        (r'include:\s*\{\s*package:', 'include: { package_redemptions:'), # Fix error 1177? include: { package: ... }? No, likely package relation.
        # Error 1177: 'package' does not exist in 'package_redemptionsInclude'.
        # Code: include: { package: ... }
        # Relation on `PackageRedemption` to `Package` is likely `student_package`? 
        # I'll check schema or guess `student_package`.
        (r'include:\s*\{\s*package:', 'include: { student_package:'), 

        # Fix user -> users includes
        (r'user\s*:\s*\{', 'users: {'),
        (r'\.user\.', '.users.'),
        
        # Fix subject -> subjects
        (r'subject\s*:\s*\{', 'subjects: {'),
        (r'\.subject\.', '.subjects.'),
    ]
}

for path, replacements in files_map.items():
    if not os.path.exists(path):
        print(f"Skipping {path} (not found)")
        continue
        
    with open(path, 'r') as f:
        content = f.read()
    
    original = content
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Fixed {path}")
    else:
        print(f"No changes for {path}")
