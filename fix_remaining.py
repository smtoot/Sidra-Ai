import sys
import re
import os

files_map = {
    'apps/api/src/package/package.service.ts': [
        (r'prisma\.packageTier\b', 'prisma.package_tiers'),
        (r'prisma\.teacherDemoSettings\b', 'prisma.teacher_demo_settings'),
        (r'prisma\.packageTransaction\b', 'prisma.package_transactions'),
        (r'prisma\.studentPackage\b', 'prisma.student_packages'),
        (r'prisma\.wallet\b', 'prisma.wallets'),
        (r'prisma\.transaction\b', 'prisma.transactions'),
    ],
    'apps/api/src/package/demo.service.ts': [
        (r'owner\s*:\s*true', 'users: true'), # Attempt fix for owner relation
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
