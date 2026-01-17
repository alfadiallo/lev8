-- Update roles for Interview Tool
-- 1. Drop the existing constraint to allow new role types
ALTER TABLE interview_session_interviewers 
DROP CONSTRAINT IF EXISTS interview_session_interviewers_role_check;

-- 2. Update existing 'interviewer' roles to split between Core/Teaching Faculty
WITH numbered_interviewers AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM interview_session_interviewers
    WHERE role = 'interviewer'
)
UPDATE interview_session_interviewers isi
SET role = CASE 
    WHEN ni.rn % 2 = 1 THEN 'core_faculty'
    ELSE 'teaching_faculty'
END
FROM numbered_interviewers ni
WHERE isi.id = ni.id;

-- 3. Add updated constraint
ALTER TABLE interview_session_interviewers 
ADD CONSTRAINT interview_session_interviewers_role_check 
CHECK (role IN ('program_director', 'core_faculty', 'teaching_faculty', 'interviewer', 'coordinator', 'resident'));

-- Verify changes
SELECT session_id, interviewer_name, role 
FROM interview_session_interviewers 
ORDER BY session_id, role;
