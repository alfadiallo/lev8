-- Rename "Intelligence" to "Quotient" in framework pillar names
-- This aligns the database with the EQ·PQ·IQ brand terminology

UPDATE public.framework_pillars
SET name = 'Emotional Quotient (EQ)'
WHERE name = 'Emotional Intelligence (EQ)';

UPDATE public.framework_pillars
SET name = 'Professional Quotient (PQ)'
WHERE name = 'Professional Intelligence (PQ)';

UPDATE public.framework_pillars
SET name = 'Intellectual Quotient (IQ)'
WHERE name = 'Intellectual Intelligence (IQ)';
