-- ============================================================================
-- DIAGNOSTIC: Check Current Database State
-- Run this to see what tables/columns already exist
-- ============================================================================

-- 1. List all public tables
SELECT 
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE columns.table_name = tables.table_name 
   AND columns.table_schema = 'public') as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check if programs table exists and show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'programs'
ORDER BY ordinal_position;

-- 3. Check existing constraints on programs table
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'programs';

-- 4. Check if user_profiles table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check which base tables we need exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'health_systems') 
    THEN '✅ health_systems exists'
    ELSE '❌ health_systems missing'
  END as health_systems_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') 
    THEN '✅ programs exists'
    ELSE '❌ programs missing'
  END as programs_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') 
    THEN '✅ user_profiles exists'
    ELSE '❌ user_profiles missing'
  END as user_profiles_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'residents') 
    THEN '✅ residents exists'
    ELSE '❌ residents missing'
  END as residents_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_classes') 
    THEN '✅ academic_classes exists'
    ELSE '❌ academic_classes missing'
  END as academic_classes_status;


