-- Add name column and IP index to eqpqiq_visitors for the EPI Quotient access gate
ALTER TABLE eqpqiq_visitors ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE INDEX IF NOT EXISTS idx_eqpqiq_visitors_ip ON eqpqiq_visitors(ip_address);
