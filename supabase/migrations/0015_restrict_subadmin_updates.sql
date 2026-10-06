-- Prevent sub-admins from updating member details (they can only create and soft-delete)

CREATE OR REPLACE FUNCTION prevent_subadmin_member_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'subadmin' THEN
    -- If they try to change core fields, throw an error
    IF NEW.name IS DISTINCT FROM OLD.name OR 
       NEW.phone IS DISTINCT FROM OLD.phone OR 
       NEW.plan_id IS DISTINCT FROM OLD.plan_id OR
       NEW.anchor_day IS DISTINCT FROM OLD.anchor_day OR
       NEW.join_date IS DISTINCT FROM OLD.join_date OR
       NEW.has_trainer IS DISTINCT FROM OLD.has_trainer OR
       NEW.current_due_date IS DISTINCT FROM OLD.current_due_date
    THEN
      RAISE EXCEPTION 'Sub-admins can only create and delete users. Updating details is not allowed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_subadmin_updates ON members;
CREATE TRIGGER check_subadmin_updates
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION prevent_subadmin_member_updates();
