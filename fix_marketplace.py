import sys

path = 'apps/api/src/marketplace/marketplace.service.ts'

with open(path, 'r') as f:
    content = f.read()

content = content.replace('prisma.booking.', 'prisma.bookings.')
content = content.replace('prisma.subject.', 'prisma.subjects.')
content = content.replace('prisma.studentPackage.', 'prisma.student_packages.')
content = content.replace('prisma.curriculaSubject.', 'prisma.curriculum_subjects.')
content = content.replace('prisma.gradeLevel.', 'prisma.grade_levels.')
content = content.replace('prisma.teacher_subjectsGrade.', 'prisma.teacher_subject_grades.')
content = content.replace('prisma.teacherDemoSettings.', 'prisma.teacher_demo_settings.')
content = content.replace('prisma.packageTier.', 'prisma.package_tiers.')
content = content.replace('prisma.availabilityException.', 'prisma.availability_exceptions.')
content = content.replace('prisma.rating.', 'prisma.ratings.')
content = content.replace('grades: {', 'grade_levels: {')
content = content.replace('availabilityExceptions: {', 'availability_exceptions: {')
content = content.replace('user: true', 'users: true')
content = content.replace('include: { subject: true', 'include: { subjects: true')
# fix specific case for stage include
content = content.replace('stage: {', 'educational_stages: {')

with open(path, 'w') as f:
    f.write(content)
print(f"Fixed {path}")
