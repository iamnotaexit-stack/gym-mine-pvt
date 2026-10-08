-- Enforce email as mandatory for all members (required for magic links)

-- First, backfill any existing members who have a NULL or empty email 
-- to prevent the NOT NULL constraint from failing.
UPDATE members 
SET email = REPLACE(id::TEXT, '-', '') || '@gym.dummy' 
WHERE email IS NULL OR trim(email) = '';

-- Now enforce NOT NULL at the database level
ALTER TABLE members ALTER COLUMN email SET NOT NULL;
