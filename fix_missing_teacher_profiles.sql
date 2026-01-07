-- Fix missing teacher_profile records for existing teacher users
-- This script creates teacher_profiles for any teacher users that don't have one

-- Insert missing teacher_profiles for all TEACHER role users
INSERT INTO teacher_profiles (
    id,
    "userId",
    "applicationStatus",
    "hasCompletedOnboarding",
    "onboardingStep",
    "averageRating",
    "totalReviews",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    u.id,
    'DRAFT',
    false,
    0,
    5.0,
    0,
    NOW(),
    NOW()
FROM users u
WHERE u.role = 'TEACHER'
AND NOT EXISTS (
    SELECT 1 FROM teacher_profiles tp WHERE tp."userId" = u.id
);

-- Verify the fix
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    tp.id as profile_id,
    tp."applicationStatus"
FROM users u
LEFT JOIN teacher_profiles tp ON tp."userId" = u.id
WHERE u.role = 'TEACHER';
