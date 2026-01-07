-- Running the Board - Add Educator Fields
-- Adds educator tracking to simulation sessions

-- Add educator_name column to store the name of the educator/facilitator
ALTER TABLE public.running_board_sessions
ADD COLUMN IF NOT EXISTS educator_name VARCHAR(255);

-- Add educator_type to track whether educator is resident, faculty, or custom entry
ALTER TABLE public.running_board_sessions
ADD COLUMN IF NOT EXISTS educator_type VARCHAR(20) 
CHECK (educator_type IN ('resident', 'faculty', 'custom'));

-- Add educator_id to optionally link to a resident or faculty member
ALTER TABLE public.running_board_sessions
ADD COLUMN IF NOT EXISTS educator_id UUID;

-- Create index for educator lookups
CREATE INDEX IF NOT EXISTS idx_rb_sessions_educator ON public.running_board_sessions(educator_id);
CREATE INDEX IF NOT EXISTS idx_rb_sessions_educator_type ON public.running_board_sessions(educator_type);

-- Add comments
COMMENT ON COLUMN public.running_board_sessions.educator_name IS 'Name of the educator facilitating the simulation';
COMMENT ON COLUMN public.running_board_sessions.educator_type IS 'Type of educator: resident, faculty, or custom (external)';
COMMENT ON COLUMN public.running_board_sessions.educator_id IS 'Optional UUID linking to residents or faculty table';




