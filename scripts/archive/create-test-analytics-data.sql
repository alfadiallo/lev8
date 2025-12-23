-- Create Test Analytics Data
-- Run this script to populate the analytics dashboard with sample data
-- Replace 'YOUR_RESIDENT_ID_HERE' with an actual resident UUID from your database

-- ============================================================================
-- STEP 1: Find a resident ID to test with
-- ============================================================================
-- Run this first to get a resident ID:
/*
SELECT 
  r.id as resident_id,
  up.full_name,
  ac.class_year
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id
LEFT JOIN public.academic_classes ac ON ac.id = r.class_id
LIMIT 5;
*/

-- Copy one of the resident_id values and replace it in all the INSERT statements below

-- ============================================================================
-- STEP 2: Create SWOT Summary (PGY-2 Fall)
-- ============================================================================
INSERT INTO public.swot_summaries (
  resident_id,
  period_label,
  strengths,
  weaknesses,
  opportunities,
  threats,
  n_comments_analyzed,
  ai_confidence,
  ai_model_version,
  is_current
) VALUES (
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  'PGY-2 Fall',
  '[
    {
      "description": "Excellent bedside manner and patient communication skills",
      "frequency": 5,
      "supporting_quotes": [
        {
          "quote": "Shows exceptional empathy with distressed patients and families",
          "citation": "Dr. Sarah Johnson, ED Attending - 10/15/2024"
        },
        {
          "quote": "Takes time to explain procedures clearly to anxious patients",
          "citation": "Dr. Michael Chen, Trauma Surgery - 10/22/2024"
        },
        {
          "quote": "Patients frequently mention feeling heard and understood",
          "citation": "Nurse Manager Patricia Davis - 10/28/2024"
        }
      ]
    },
    {
      "description": "Strong clinical reasoning and differential diagnosis development",
      "frequency": 4,
      "supporting_quotes": [
        {
          "quote": "Consistently develops thorough and appropriate differential diagnoses",
          "citation": "Dr. Lisa Rodriguez, Emergency Medicine - 11/03/2024"
        },
        {
          "quote": "Excellent analytical approach to complex cases",
          "citation": "Dr. Robert Kim, Hospitalist - 10/30/2024"
        }
      ]
    },
    {
      "description": "Effective team leadership during resuscitations",
      "frequency": 3,
      "supporting_quotes": [
        {
          "quote": "Calm and directive during critical situations",
          "citation": "Dr. James Park, Critical Care - 10/29/2024"
        },
        {
          "quote": "Clear communication with nursing and respiratory therapy during codes",
          "citation": "RN Supervisor Maria Gonzalez - 11/01/2024"
        }
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Documentation often delayed beyond shift end",
      "frequency": 6,
      "supporting_quotes": [
        {
          "quote": "Charts frequently completed several hours after shift completion",
          "citation": "Dr. Emily Williams, Program Director - 10/18/2024"
        },
        {
          "quote": "Documentation efficiency needs improvement for workflow",
          "citation": "Dr. Thomas Anderson, Associate Program Director - 10/25/2024"
        }
      ]
    },
    {
      "description": "Could improve efficiency with routine procedures",
      "frequency": 2,
      "supporting_quotes": [
        {
          "quote": "Takes longer than expected for standard procedures like LPs",
          "citation": "Dr. Jennifer Lee, ED Attending - 10/20/2024"
        }
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Potential to develop expertise in ultrasound-guided procedures",
      "frequency": 2,
      "supporting_quotes": [
        {
          "quote": "Shows strong interest and natural aptitude for point-of-care ultrasound",
          "citation": "Dr. Robert Kim, Ultrasound Director - 11/01/2024"
        },
        {
          "quote": "Would benefit from advanced ultrasound elective",
          "citation": "Dr. Sarah Johnson, ED Attending - 10/15/2024"
        }
      ]
    },
    {
      "description": "Leadership potential for chief resident role",
      "frequency": 1,
      "supporting_quotes": [
        {
          "quote": "Natural teaching ability with medical students",
          "citation": "Dr. Emily Williams, Program Director - 10/18/2024"
        }
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Workload balance may lead to burnout if not addressed",
      "frequency": 1,
      "supporting_quotes": [
        {
          "quote": "Taking on too many extra shifts, may need wellness check-in",
          "citation": "Dr. Thomas Anderson, APD - 10/25/2024"
        }
      ]
    }
  ]'::jsonb,
  12,
  0.87,
  'claude-sonnet-4-20250514',
  true
);

-- ============================================================================
-- STEP 3: Create Period Scores (PGY-2 Fall)
-- ============================================================================
INSERT INTO public.period_scores (
  resident_id,
  period_label,
  faculty_eq_avg,
  faculty_pq_avg,
  faculty_iq_avg,
  faculty_n_raters,
  self_eq_avg,
  self_pq_avg,
  self_iq_avg,
  self_faculty_gap_eq,
  self_faculty_gap_pq,
  self_faculty_gap_iq,
  ai_eq_avg,
  ai_pq_avg,
  ai_iq_avg,
  ai_n_comments,
  ai_confidence_avg,
  is_current
) VALUES (
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  'PGY-2 Fall',
  4.2,  -- Faculty rates EQ as 4.2/5.0
  4.5,  -- Faculty rates PQ as 4.5/5.0
  4.0,  -- Faculty rates IQ as 4.0/5.0
  5,    -- 5 faculty evaluators
  3.8,  -- Self rates EQ as 3.8/5.0 (underestimate)
  4.2,  -- Self rates PQ as 4.2/5.0 (underestimate)
  4.3,  -- Self rates IQ as 4.3/5.0 (overestimate)
  -0.4, -- Gap: Self is 0.4 lower than faculty for EQ
  -0.3, -- Gap: Self is 0.3 lower than faculty for PQ
  0.3,  -- Gap: Self is 0.3 higher than faculty for IQ
  4.1,  -- AI analyzed comments and scored EQ as 4.1
  4.3,  -- AI analyzed comments and scored PQ as 4.3
  3.9,  -- AI analyzed comments and scored IQ as 3.9
  12,   -- AI analyzed 12 historical comments
  0.85, -- AI confidence: 85%
  true
);

-- ============================================================================
-- STEP 4: Create ITE Scores (2 years of data)
-- ============================================================================
INSERT INTO public.ite_scores (
  resident_id,
  test_date,
  academic_year,
  pgy_level,
  raw_score,
  percentile
) VALUES 
(
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  '2024-10-15',
  '2024-2025',
  'PGY-2',
  425,
  72.5
),
(
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  '2023-10-12',
  '2023-2024',
  'PGY-1',
  380,
  65.0
);

-- ============================================================================
-- STEP 5: Create ROSH Completion Snapshots (Optional)
-- ============================================================================
INSERT INTO public.rosh_completion_snapshots (
  resident_id,
  snapshot_date,
  academic_year,
  pgy_level,
  completion_percent
) VALUES 
(
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  '2024-11-01',
  '2024-2025',
  'PGY-2',
  68.5
),
(
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  '2024-10-01',
  '2024-2025',
  'PGY-2',
  45.2
),
(
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  '2024-09-01',
  '2024-2025',
  'PGY-2',
  22.0
);

-- ============================================================================
-- OPTIONAL: Create Additional Period (PGY-2 Spring)
-- ============================================================================

-- SWOT Summary for Spring
INSERT INTO public.swot_summaries (
  resident_id,
  period_label,
  strengths,
  weaknesses,
  opportunities,
  threats,
  n_comments_analyzed,
  ai_confidence,
  ai_model_version,
  is_current
) VALUES (
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  'PGY-2 Spring',
  '[
    {
      "description": "Significantly improved documentation timeliness",
      "frequency": 4,
      "supporting_quotes": [
        {"quote": "Charts now completed during shift - excellent improvement", "citation": "Dr. Emily Williams, PD - 03/15/2025"}
      ]
    },
    {
      "description": "Developing ultrasound expertise",
      "frequency": 3,
      "supporting_quotes": []
    }
  ]'::jsonb,
  '[
    {
      "description": "Still needs work on complex procedures",
      "frequency": 2,
      "supporting_quotes": []
    }
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  8,
  0.82,
  'claude-sonnet-4-20250514',
  true
);

-- Period Scores for Spring
INSERT INTO public.period_scores (
  resident_id,
  period_label,
  faculty_eq_avg,
  faculty_pq_avg,
  faculty_iq_avg,
  faculty_n_raters,
  is_current
) VALUES (
  'YOUR_RESIDENT_ID_HERE', -- REPLACE THIS
  'PGY-2 Spring',
  4.4,  -- Improved from 4.2
  4.7,  -- Improved from 4.5
  4.2,  -- Improved from 4.0
  6,
  true
);

-- ============================================================================
-- STEP 6: Verify Data Was Inserted
-- ============================================================================
-- Run these queries to confirm:

-- Check SWOT summaries
SELECT period_label, n_comments_analyzed, ai_confidence 
FROM swot_summaries 
WHERE resident_id = 'YOUR_RESIDENT_ID_HERE';
-- Expected: 1-2 rows

-- Check period scores
SELECT period_label, faculty_eq_avg, faculty_pq_avg, faculty_iq_avg 
FROM period_scores 
WHERE resident_id = 'YOUR_RESIDENT_ID_HERE';
-- Expected: 1-2 rows

-- Check ITE scores
SELECT test_date, pgy_level, percentile 
FROM ite_scores 
WHERE resident_id = 'YOUR_RESIDENT_ID_HERE'
ORDER BY test_date DESC;
-- Expected: 2 rows

-- Check ROSH snapshots
SELECT snapshot_date, completion_percent 
FROM rosh_completion_snapshots 
WHERE resident_id = 'YOUR_RESIDENT_ID_HERE'
ORDER BY snapshot_date DESC;
-- Expected: 3 rows

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If all queries above return data, you're ready to test the dashboard!
-- Navigate to: http://localhost:3000/modules/understand/overview


