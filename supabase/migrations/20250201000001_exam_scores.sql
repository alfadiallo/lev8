-- Create exam_scores table for USMLE, COMLEX, and Board scores
CREATE TABLE IF NOT EXISTS public.exam_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    
    -- Exam type
    exam_type VARCHAR NOT NULL CHECK (
        exam_type IN (
            'USMLE Step 1', 
            'USMLE Step 2', 
            'USMLE Step 3', 
            'COMLEX Level 1', 
            'COMLEX Level 2', 
            'COMLEX Level 3', 
            'Board Certification'
        )
    ),
    
    -- Score Details
    score NUMERIC(5, 2),
    percentile NUMERIC(5, 2),
    
    -- Date taken (or just year)
    exam_date DATE,
    year_taken INTEGER, 
    
    -- Pass/Fail status
    passed BOOLEAN,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_exam_scores_resident ON public.exam_scores(resident_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_type ON public.exam_scores(exam_type);

-- Trigger for updated_at
CREATE TRIGGER update_exam_scores_updated_at BEFORE UPDATE ON public.exam_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies matching other tables
CREATE POLICY "Enable read access for authenticated users" ON public.exam_scores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.exam_scores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.exam_scores
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.exam_scores
    FOR DELETE USING (auth.role() = 'authenticated');





