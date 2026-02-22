-- Ensure each respondent can only have one rating per resident.
-- This protects tally integrity for survey completion and audit trails.

-- Keep the latest row when duplicates exist (defensive cleanup).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY form_submission_id, resident_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM structured_ratings
  WHERE form_submission_id IS NOT NULL
)
DELETE FROM structured_ratings sr
USING ranked r
WHERE sr.id = r.id
  AND r.rn > 1;

-- Enforce uniqueness going forward.
CREATE UNIQUE INDEX IF NOT EXISTS structured_ratings_unique_form_submission_resident
  ON structured_ratings (form_submission_id, resident_id)
  WHERE form_submission_id IS NOT NULL;
