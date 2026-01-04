import sys
import re
import os

files_map = {
    'apps/api/src/package/package.service.ts': [
        # Fix missing ID in package_tiers
        (r'sessionCount:\s*dto\.sessionCount,', 'id: crypto.randomUUID(),\n          sessionCount: dto.sessionCount,'),
        # Fix missing ID in transactions (2 occurrences)
        (r'readableId:\s*readableId,', 'id: crypto.randomUUID(),\n          readableId: readableId,'),
        # Fix missing ID in wallets
        (r'return\s*this\.prisma\.wallets\.create\(\{\s*data:\s*\{', 'return this.prisma.wallets.create({\n        data: {\n          id: crypto.randomUUID(),'),
        # Fix relations and plural
        (r'teacher\s*:\s*\{', 'teacher_profiles: {'),
        (r'\.booking\.', '.bookings.'),
        (r'\.packageRedemption\.', '.package_redemptions.'),
        (r'\.subject\.', '.subjects.'), # Be careful with subjectId
        (r'subject\s*:\s*\{', 'subjects: {'),
        (r'prisma\.subject\b', 'prisma.subjects'),
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
    
    # revert subjectId damage if any
    content = content.replace('.subjectsId', '.subjectId')
    
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Fixed {path}")
    else:
        print(f"No changes for {path}")
