#!/usr/bin/env python3
"""Fix req.users back to req.user (HTTP request property)"""
import re
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Fix req.users. -> req.user.
    content = re.sub(r'req\.users\.', 'req.user.', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    fixed = 0
    for ts_file in Path("apps/api/src").rglob("*.ts"):
        if fix_file(ts_file):
            fixed += 1
            print(f"✓ Fixed: {ts_file}")
    print(f"\n✅ Fixed {fixed} files")

if __name__ == "__main__":
    main()
