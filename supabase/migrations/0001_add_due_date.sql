ALTER TABLE members ADD COLUMN current_due_date DATE;

-- For existing members (if any), set it to join_date initially
UPDATE members SET current_due_date = join_date WHERE current_due_date IS NULL;

ALTER TABLE members ALTER COLUMN current_due_date SET NOT NULL;
