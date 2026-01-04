import sys
import re
import os

files_map = {
    'apps/api/src/package/package.service.ts': [
        # Inject ID for bookings
        (r'return\s*tx\.bookings\.create\(\{\s*data:\s*\{', 'return tx.bookings.create({\n        data: {\n          id: crypto.randomUUID(),'),
        (r'return\s*this\.prisma\.bookings\.create\(\{\s*data:\s*\{', 'return this.prisma.bookings.create({\n        data: {\n          id: crypto.randomUUID(),'),
        
        # Inject ID for teacher_demo_settings (packagesEnabled context)
        (r'data:\s*\{\s*teacherId,\s*demoEnabled,\s*packagesEnabled\s*\}', 'data: { id: crypto.randomUUID(), teacherId, demoEnabled, packagesEnabled }'),
        
        # Inject ID for teacher_package_tier_settings
        (r'data:\s*\{\s*teacherId,\s*tierId,\s*isEnabled\s*\}', 'data: { id: crypto.randomUUID(), teacherId, tierId, isEnabled }'),

        # Fix property access and includes
        (r'\.user\.', '.users.'), 
        (r'include:\s*\{\s*subject:', 'include: { subjects:'),
        (r'include:\s*\{\s*packageRedemption:', 'include: { package_redemptions:'),
        (r'\.packageRedemption', '.package_redemptions'),
        (r'\.package_redemptions\b', '.package_redemptions'), # catch double fix if any? no
        
        # Fix tier include
        (r'include:\s*\{\s*tier:', 'include: { package_tiers:'),
        
        # Fix singular subjectsId confusion if any (Error 627)
        (r'\.subjects\.id', '.subjects[0].id'), # Risky? No, error said Property 'subjects' does not exist on type ... 'subjectId'
        # Error 627: Property 'subjects' does not exist... Did you mean 'subjectId'? 
        # Code: ... .subjects. ... 
        # I'll try to revert .subjects to .subjectId IF it was .subjectId before regex.
        # But previous regex changed .subject. to .subjects. 
        # If code was `booking.subjectId`, it became `booking.subjectsId`? 
        # I already fixed `.subjectsId` -> `.subjectId` in previous script?
        # Error 627 says: `Property 'subjects' does not exist ... Did you mean 'subjectId'?`
        # This implies code has `.subjects` but object has `subjectId`.
        # I will replace `.subjects` with `.subjectId` if it looks like an ID access?
        # Or maybe it's `booking.subject` (relation) which I renamed to `booking.subjects`?
        # But `Transaction` (or result) doesn't have relation included?
        # I'll check error 627 context if possible. But I'll blindly try `.subjects` -> `.subjectId` if followed by nothing? 
        # No, risk of breaking relation access.
        # I will leave 627.
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
