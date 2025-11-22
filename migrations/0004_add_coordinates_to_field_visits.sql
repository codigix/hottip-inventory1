-- Add coordinates columns to field_visits if they don't exist  
ALTER TABLE field_visits ADD COLUMN IF NOT EXISTS latitude numeric(10, 7), ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);  
