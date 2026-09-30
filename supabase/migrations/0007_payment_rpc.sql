-- RPC to record payment safely
CREATE OR REPLACE FUNCTION record_payment(
  p_member_id UUID,
  p_amount INTEGER,
  p_trainer_fee INTEGER,
  p_method TEXT,
  p_paid_on DATE,
  p_covers_from DATE,
  p_covers_to DATE,
  p_note TEXT
) RETURNS JSONB AS $$
DECLARE
  v_payment_id UUID;
  v_member_due_date DATE;
  v_payment JSONB;
BEGIN
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

  -- Insert payment
  INSERT INTO payments (member_id, amount, trainer_fee, method, paid_on, covers_from, covers_to, note)
  VALUES (p_member_id, p_amount, p_trainer_fee, p_method, p_paid_on, p_covers_from, p_covers_to, p_note)
  RETURNING id INTO v_payment_id;

  -- Update member
  UPDATE members 
  SET current_due_date = p_covers_to, is_frozen = false
  WHERE id = p_member_id;

  -- Return the payment record
  SELECT row_to_json(p) INTO v_payment
  FROM payments p
  WHERE id = v_payment_id;

  RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
