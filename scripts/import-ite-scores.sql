-- Import ITE Scores from Actual Program Data
-- Matches residents by name and inserts ITE scores with correct dates

-- ============================================================================
-- CLASS OF 2025 (Graduated June 2025) - PGY-3
-- 3 ITE exams: PGY-1 (March 2023), PGY-2 (March 2024), PGY-3 (March 2025)
-- ============================================================================

-- Nadine Ajami: 67%/55%, 69%/32%, 68%/16%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 67, 55
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Nadine Ajami'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 69, 32
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Nadine Ajami'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 68, 16
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Nadine Ajami';

-- Sebastian Fresquet: 68%/59%, 86%/96%, 86%/92%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 68, 59
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sebastian Fresquet'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 86, 96
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sebastian Fresquet'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 86, 92
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sebastian Fresquet';

-- Sara Greenwald: 66%/51%, 65%/15%, 79%/72%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 66, 51
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sara Greenwald'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 65, 15
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sara Greenwald'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 79, 72
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Sara Greenwald';

-- Jalyn Joseph: 67%/55%, 70%/37%, 75%/52%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 67, 55
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jalyn Joseph'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 70, 37
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jalyn Joseph'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 75, 52
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jalyn Joseph';

-- Ryan Kelly: 63%/35%, 74%/58%, 75%/52%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 63, 35
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ryan Kelly'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 74, 58
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ryan Kelly'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 75, 52
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ryan Kelly';

-- Hadley Modeen: 59%/18%, 65%/15%, 72%/36%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 59, 18
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Hadley Modeen'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 65, 15
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Hadley Modeen'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 72, 36
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Hadley Modeen';

-- Ambika Shivarajpur: 63%/35%, 65%/15%, 79%/72%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 63, 35
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ambika Shivarajpur'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 65, 15
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ambika Shivarajpur'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 79, 72
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Ambika Shivarajpur';

-- Larissa Tavares: 52%/2%, 62%/7%, 71%/30%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 52, 2
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Larissa Tavares'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 62, 7
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Larissa Tavares'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 71, 30
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Larissa Tavares';

-- Jennifer Truong: 62%/31%, 69%/32%, 77%/62%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 62, 31
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jennifer Truong'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 69, 32
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jennifer Truong'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 77, 62
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Jennifer Truong';

-- Carly Whittaker: 63%/35%, 70%/37%, 74%/46%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2023-03-15'::date, '2022-2023', 'PGY-1', 63, 35
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Carly Whittaker'
UNION ALL
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-2', 70, 37
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Carly Whittaker'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-3', 74, 46
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Carly Whittaker';

-- ============================================================================
-- CLASS OF 2026 (Graduates June 2026) - PGY-2
-- 2 ITE exams: PGY-1 (March 2024), PGY-2 (March 2025)
-- ============================================================================

-- Morgan Reel: 66%/59%, 74%/72%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 66, 59
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Morgan Reel'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 74, 72
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Morgan Reel';

-- Andrew Gonedes: 69%/71%, 81%/93%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 69, 71
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Andrew Gonedes'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 81, 93
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Andrew Gonedes';

-- Noy Lutwak: 60%/28%, 74%/72%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 60, 28
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Noy Lutwak'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 74, 72
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Noy Lutwak';

-- Kenneth Holton: 57%/14%, 73%/67%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 57, 14
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Kenneth Holton'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 73, 67
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Kenneth Holton';

-- Simon Londono: 81%/97%, 90%/99%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 81, 97
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Simon Londono'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 90, 99
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Simon Londono';

-- Mariam Attia: 81%/97%, 82%/93%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 81, 97
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Mariam Attia'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 82, 93
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Mariam Attia';

-- Anastasia Alpizar: 74%/88%, 72%/62%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 74, 88
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Anastasia Alpizar'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 72, 62
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Anastasia Alpizar';

-- Andrei Simon: 65%/53%, 72%/62%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 65, 53
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Andrei Simon'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 72, 62
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Andrei Simon';

-- Alyse Nelsen: 63%/43%, 73%/67%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 63, 43
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Alyse Nelsen'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 73, 67
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Alyse Nelsen';

-- Richard Halpern: 74%/88%, 76%/81%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2024-03-15'::date, '2023-2024', 'PGY-1', 74, 88
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Richard Halpern'
UNION ALL
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-2', 76, 81
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Richard Halpern';

-- ============================================================================
-- CLASS OF 2027 (Graduates June 2027) - PGY-1
-- 1 ITE exam: PGY-1 (March 2025)
-- ============================================================================

-- Farah Azzouz: 63%/51%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 63, 51
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Farah Azzouz';

-- Alexandra Blanco: 66%/65%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 66, 65
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Alexandra Blanco';

-- Nicholas Booth: 63%/51%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 63, 51
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Nicholas Booth';

-- Aleksandr Butovskiy: 66%/65%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 66, 65
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Aleksandr Butovskiy';

-- Marianne Lopez: 66%/65%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 66, 65
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Marianne Lopez';

-- Spencer Rice: 67%/70%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 67, 70
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Spencer Rice';

-- Claudia Risi: 59%/28%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 59, 28
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Claudia Risi';

-- Cale Schneider: 69%/79%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 69, 79
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Cale Schneider';

-- Kyle Seifert: 66%/65%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 66, 65
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Kyle Seifert';

-- Samantha Stein: 66%/65%
INSERT INTO public.ite_scores (resident_id, test_date, academic_year, pgy_level, raw_score, percentile)
SELECT r.id, '2025-03-15'::date, '2024-2025', 'PGY-1', 66, 65
FROM residents r JOIN user_profiles up ON up.id = r.user_id WHERE up.full_name = 'Samantha Stein';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count ITE scores by class
SELECT 
  EXTRACT(YEAR FROM ac.graduation_date) as class_year,
  COUNT(*) as total_ite_records,
  COUNT(DISTINCT r.id) as residents_with_scores,
  STRING_AGG(DISTINCT its.pgy_level, ', ' ORDER BY its.pgy_level) as pgy_levels
FROM public.ite_scores its
JOIN public.residents r ON r.id = its.resident_id
JOIN public.academic_classes ac ON ac.id = r.class_id
GROUP BY EXTRACT(YEAR FROM ac.graduation_date)
ORDER BY EXTRACT(YEAR FROM ac.graduation_date);

-- Show Larissa's ITE scores (for dashboard testing)
SELECT 
  up.full_name,
  its.test_date,
  its.pgy_level,
  its.raw_score,
  its.percentile
FROM public.ite_scores its
JOIN public.residents r ON r.id = its.resident_id
JOIN public.user_profiles up ON up.id = r.user_id
WHERE up.full_name = 'Larissa Tavares'
ORDER BY its.test_date;

/*
✅ ITE Score Import Complete!

Imported:
- Class 2025: 10 residents × 3 exams = 30 scores
- Class 2026: 10 residents × 2 exams = 20 scores  
- Class 2027: 10 residents × 1 exam = 10 scores
- Class 2028: 10 residents × 0 exams = 0 scores

Total: 60 ITE score records

Next: Test the dashboard with Larissa's complete data!
  - SWOT summaries ✅
  - Period scores ✅
  - ITE scores ✅ (52% → 62% → 71%, showing steady growth)
*/

