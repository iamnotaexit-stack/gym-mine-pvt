-- Drop insecure members policies
DROP POLICY IF EXISTS "Anyone authenticated can insert members" ON members;
DROP POLICY IF EXISTS "Anyone authenticated can update members" ON members;

-- Create secure policies for members
CREATE POLICY "Staff can insert members" ON members
  FOR INSERT WITH CHECK (get_auth_role() IN ('owner', 'subadmin'));

CREATE POLICY "Staff can update members" ON members
  FOR UPDATE USING (get_auth_role() IN ('owner', 'subadmin'));

-- Add constraint to payments for positive amounts
ALTER TABLE payments ADD CONSTRAINT payments_amount_positive CHECK (amount >= 0);

-- Enforce 200 member capacity
CREATE OR REPLACE FUNCTION enforce_member_capacity()
RETURNS TRIGGER AS $$
DECLARE
  active_count INT;
BEGIN
  SELECT COUNT(*) INTO active_count FROM members WHERE deleted_at IS NULL;
  IF active_count >= 200 THEN
    RAISE EXCEPTION 'Gym capacity of 200 members has been reached.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_member_capacity
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION enforce_member_capacity();
