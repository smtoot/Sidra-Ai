import sys
import re
import os

files_map = {
    'apps/api/src/package/package.service.ts': [
        (r'\.packageTier\b', '.package_tiers'),
        (r'\.teacherDemoSettings\b', '.teacher_demo_settings'),
        (r'\.packageTransaction\b', '.package_transactions'),
        (r'\.studentPackage\b', '.student_packages'),
        (r'\.wallet\b', '.wallets'),
        (r'\.transaction\b', '.transactions'),
        (r'user\s*:\s*\{', 'users: {'),
        (r'subject\s*:\s*\{', 'subjects: {'),
        (r'\.teacherPackageTierSetting\b', '.teacher_package_tier_settings'),
        (r'teacher\s*:\s*true', 'teacher_profiles: true'), # Guess for teacher include
    ],
    'apps/api/src/package/demo.service.ts': [
        (r'owner\s*:\s*\{', 'users: {'),
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
