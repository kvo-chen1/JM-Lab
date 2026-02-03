-- SQL Cleanup Script for Supabase SQL Editor
-- Copy and run this in the Supabase Dashboard SQL Editor

-- 1. Delete test users from public.users (orphaned or not)
DELETE FROM public.users
WHERE 
    email LIKE '%@example.com' OR 
    email LIKE '%@test.com' OR 
    email LIKE '%@repro.com' OR
    email LIKE 'test%' OR
    username LIKE 'user_3100%' OR
    email ~ '^[0-9]+$'; -- Deletes rows where email consists only of numbers

-- 2. Ensure auth.users are also cleaned (if they exist)
DELETE FROM auth.users
WHERE 
    email LIKE '%@example.com' OR 
    email LIKE '%@test.com' OR 
    email LIKE '%@repro.com' OR
    email LIKE 'test%' OR
    raw_user_meta_data->>'username' LIKE 'user_3100%';

-- 3. Verify cleanup
SELECT count(*) as remaining_test_users FROM public.users 
WHERE email LIKE '%@example.com';
