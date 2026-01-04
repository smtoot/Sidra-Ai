#!/usr/bin/env python3
"""
Global Prisma model name fixer
Replaces all singular/camelCase Prisma models with plural/snake_case equivalents
"""

import re
import os
import sys
from pathlib import Path

# Define all replacements (singular/camelCase → plural/snake_case)
REPLACEMENTS = [
    # Most common
    (r'\.user\.', '.users.'),
    (r'\.wallet\.', '.wallets.'),
    (r'\.booking\.', '.bookings.'),
    (r'\.dispute\.', '.disputes.'),
    
    # Admin/system
    (r'\.auditLog\.', '.audit_logs.'),
    (r'\.systemSettings\.', '.system_settings.'),
    (r'\.readableIdCounter\.', '.readable_id_counters.'),
    
    # Teacher related
    (r'\.teacherProfile\.', '.teacher_profiles.'),
    (r'\.teacherSubjectGrade\.', '.teacher_subject_grades.'),
    (r'\.teacherSubject\.', '.teacher_subjects.'),
    (r'\.teacherQualification\.', '.teacher_qualifications.'),
    (r'\.teacherSkill\.', '.teacher_skills.'),
    (r'\.teacherWorkExperience\.', '.teacher_work_experiences.'),
    (r'\.teacherTeachingApproachTag\.', '.teacher_teaching_approach_tags.'),
    (r'\.interviewTimeSlot\.', '.interview_time_slots.'),
    
    # Student/Parent
    (r'\.studentPackage\.', '.student_packages.'),
    (r'\.studentProfile\.', '.student_profiles.'),
    (r'\.parentProfile\.', '.parent_profiles.'),
    (r'\.child\.', '.children.'),
    
    # Package related
    (r'\.packageTier\.', '.package_tiers.'),
    
    # Other
    (r'\.availabilityException\.', '.availability_exceptions.'),
    (r'\.notification\.', '.notifications.'),
    (r'\.savedTeacher\.', '.saved_teachers.'),
    (r'\.rating\.', '.ratings.'),
    (r'\.rescheduleRequest\.', '.reschedule_requests.'),
    (r'\.supportTicket\.', '.support_tickets.'),
    (r'\.ticketMessage\.', '.ticket_messages.'),
    (r'\.demoSession\.', '.demo_sessions.'),
]

def fix_file(filepath):
    """Fix all Prisma model names in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for pattern, replacement in REPLACEMENTS:
            content = re.sub(pattern, replacement, content)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"ERROR processing {filepath}: {e}", file=sys.stderr)
        return False

def main():
    """Fix all TypeScript files in apps/api/src"""
    base_dir = Path("apps/api/src")
    
    if not base_dir.exists():
        print(f"ERROR: Directory {base_dir} not found", file=sys.stderr)
        sys.exit(1)
    
    fixed_count = 0
    total_count = 0
    
    # Find all .ts files (excluding .spec.ts and .d.ts)
    for ts_file in base_dir.rglob("*.ts"):
        if '.spec.ts' in ts_file.name or '.d.ts' in ts_file.name:
            continue
        
        total_count += 1
        if fix_file(ts_file):
            fixed_count += 1
            print(f"✓ Fixed: {ts_file}")
    
    # Also fix scripts
    scripts_dir = Path("apps/api/scripts")
    if scripts_dir.exists():
        for ts_file in scripts_dir.rglob("*.ts"):
            total_count += 1
            if fix_file(ts_file):
                fixed_count += 1
                print(f"✓ Fixed: {ts_file}")
    
    print(f"\n✅ Complete: Fixed {fixed_count} of {total_count} files")

if __name__ == "__main__":
    main()
