-- Fix record_payment to update members.current_due_date and is_frozen
-- Also enforce OWNER role check

CREATE OR REPLACE FUNCTION record_payment(
  p_member_id UUID,
  p_amount INTEGER,
  p_trainer_fee INTEGER,
  p_method TEXT,
  p_paid_on DATE,
  p_covers_from DATE,
  p_covers_to DATE,
  p_note TEXT,
  p_idempotency UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_actor UUID;
  v_role TEXT;
BEGIN
  v_actor := auth.uid();
  v_role := auth.jwt() -> 'user_metadata' ->> 'role';

  -- Ensure only owners can record payments manually
  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'Only owners can record payments directly';
  END IF;

  -- Validate inputs
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Amount cannot be negative';
  END IF;

  -- Ensure idempotent-like behavior: check if a payment for this period already exists
  IF EXISTS (
    SELECT 1 FROM payments 
    WHERE member_id = p_member_id 
      AND covers_from = p_covers_from 
      AND covers_to = p_covers_to
  ) THEN
    RAISE EXCEPTION 'A payment covering this exact period already exists for this member.';
  END IF;

  INSERT INTO payments (member_id, amount, trainer_fee, method, paid_on, covers_from, covers_to, note, idempotency_key)
  VALUES (p_member_id, p_amount, p_trainer_fee, p_method, p_paid_on, p_covers_from, p_covers_to, p_note, p_idempotency)
  RETURNING id INTO v_payment_id;

  -- UPDATE MEMBER DUE DATE (This was missing in migration 10!)
  UPDATE members 
  SET current_due_date = p_covers_to, is_frozen = false
  WHERE id = p_member_id;

  INSERT INTO audit_log (actor, action, entity, entity_id, meta)
  VALUES (v_actor, 'record_payment', 'payments', v_payment_id, jsonb_build_object('amount', p_amount));

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
