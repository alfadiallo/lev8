-- =====================================================
-- PULSE CHECK - Add Operational Metrics
-- LOS (Length of Stay), Imaging Utilization, PPH (Patients Per Hour)
-- =====================================================

-- Add new metric columns to pulsecheck_ratings
ALTER TABLE pulsecheck_ratings
ADD COLUMN IF NOT EXISTS metric_los INTEGER, -- Length of Stay in minutes (whole numbers)
ADD COLUMN IF NOT EXISTS metric_imaging_util NUMERIC(5,2), -- Imaging utilization percentage (e.g., 45.50%)
ADD COLUMN IF NOT EXISTS metric_imaging_ct NUMERIC(5,2), -- CT imaging utilization percentage
ADD COLUMN IF NOT EXISTS metric_imaging_us NUMERIC(5,2), -- Ultrasound imaging utilization percentage
ADD COLUMN IF NOT EXISTS metric_imaging_mri NUMERIC(5,2), -- MRI imaging utilization percentage
ADD COLUMN IF NOT EXISTS metric_pph NUMERIC(4,2); -- Patients per hour (e.g., 1.85)

-- Add comments for documentation
COMMENT ON COLUMN pulsecheck_ratings.metric_los IS 'Length of Stay in minutes (whole number, typically in 100s)';
COMMENT ON COLUMN pulsecheck_ratings.metric_imaging_util IS 'Imaging utilization percentage (CT, US, MRI combined/average)';
COMMENT ON COLUMN pulsecheck_ratings.metric_imaging_ct IS 'CT imaging utilization percentage';
COMMENT ON COLUMN pulsecheck_ratings.metric_imaging_us IS 'Ultrasound (U/S) imaging utilization percentage';
COMMENT ON COLUMN pulsecheck_ratings.metric_imaging_mri IS 'MRI imaging utilization percentage';
COMMENT ON COLUMN pulsecheck_ratings.metric_pph IS 'Patients per hour (e.g., 1.85)';

-- Update the view to include new metrics
DROP VIEW IF EXISTS pulsecheck_ratings_with_totals;

CREATE OR REPLACE VIEW pulsecheck_ratings_with_totals AS
SELECT 
    r.*,
    -- EQ Total (average of 5 attributes)
    CASE 
        WHEN r.eq_empathy_rapport IS NOT NULL 
             AND r.eq_communication IS NOT NULL 
             AND r.eq_stress_management IS NOT NULL 
             AND r.eq_self_awareness IS NOT NULL 
             AND r.eq_adaptability IS NOT NULL 
        THEN ROUND((r.eq_empathy_rapport + r.eq_communication + r.eq_stress_management + r.eq_self_awareness + r.eq_adaptability) / 5.0, 1)
        ELSE NULL
    END as eq_total,
    -- PQ Total (average of 5 attributes)
    CASE 
        WHEN r.pq_reliability IS NOT NULL 
             AND r.pq_integrity IS NOT NULL 
             AND r.pq_teachability IS NOT NULL 
             AND r.pq_documentation IS NOT NULL 
             AND r.pq_leadership IS NOT NULL 
        THEN ROUND((r.pq_reliability + r.pq_integrity + r.pq_teachability + r.pq_documentation + r.pq_leadership) / 5.0, 1)
        ELSE NULL
    END as pq_total,
    -- IQ Total (average of 3 attributes)
    CASE 
        WHEN r.iq_clinical_management IS NOT NULL 
             AND r.iq_evidence_based IS NOT NULL 
             AND r.iq_procedural IS NOT NULL 
        THEN ROUND((r.iq_clinical_management + r.iq_evidence_based + r.iq_procedural) / 3.0, 1)
        ELSE NULL
    END as iq_total,
    -- Overall Total
    CASE 
        WHEN r.eq_empathy_rapport IS NOT NULL 
             AND r.eq_communication IS NOT NULL 
             AND r.eq_stress_management IS NOT NULL 
             AND r.eq_self_awareness IS NOT NULL 
             AND r.eq_adaptability IS NOT NULL
             AND r.pq_reliability IS NOT NULL 
             AND r.pq_integrity IS NOT NULL 
             AND r.pq_teachability IS NOT NULL 
             AND r.pq_documentation IS NOT NULL 
             AND r.pq_leadership IS NOT NULL
             AND r.iq_clinical_management IS NOT NULL 
             AND r.iq_evidence_based IS NOT NULL 
             AND r.iq_procedural IS NOT NULL 
        THEN ROUND((
            r.eq_empathy_rapport + r.eq_communication + r.eq_stress_management + r.eq_self_awareness + r.eq_adaptability +
            r.pq_reliability + r.pq_integrity + r.pq_teachability + r.pq_documentation + r.pq_leadership +
            r.iq_clinical_management + r.iq_evidence_based + r.iq_procedural
        ) / 13.0, 1)
        ELSE NULL
    END as overall_total,
    p.name as provider_name,
    p.email as provider_email,
    p.provider_type,
    d.name as director_name,
    d.email as director_email,
    c.name as cycle_name,
    c.due_date as cycle_due_date
FROM pulsecheck_ratings r
JOIN pulsecheck_providers p ON r.provider_id = p.id
JOIN pulsecheck_directors d ON r.director_id = d.id
JOIN pulsecheck_cycles c ON r.cycle_id = c.id;

-- Create a view for department imaging averages (for comparison)
CREATE OR REPLACE VIEW pulsecheck_dept_imaging_averages AS
SELECT 
  p.primary_department_id as department_id,
  dept.site_id,
  AVG(r.metric_imaging_ct) as avg_ct,
  AVG(r.metric_imaging_us) as avg_us,
  AVG(r.metric_imaging_mri) as avg_mri,
  AVG(r.metric_imaging_util) as avg_total
FROM pulsecheck_ratings r
JOIN pulsecheck_providers p ON r.provider_id = p.id
JOIN pulsecheck_departments dept ON p.primary_department_id = dept.id
WHERE r.status = 'completed'
  AND r.metric_imaging_util IS NOT NULL
GROUP BY p.primary_department_id, dept.site_id;
