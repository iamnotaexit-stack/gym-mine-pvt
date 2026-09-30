CREATE OR REPLACE FUNCTION check_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM members WHERE deleted_at IS NULL AND is_frozen = false) >= 1000 THEN
    RAISE EXCEPTION 'Gym capacity reached (1000 members maximum)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
