-- Update gym capacity to exactly 500 members as per business rules

CREATE OR REPLACE FUNCTION check_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM members WHERE deleted_at IS NULL AND is_frozen = false) >= 500 THEN
    RAISE EXCEPTION 'Gym capacity reached (500 members maximum)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
