-- Update record_payment RPC to include idempotency_key
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
BEGIN
  v_actor := auth.uid();

  INSERT INTO payments (member_id, amount, trainer_fee, method, paid_on, covers_from, covers_to, note, idempotency_key)
  VALUES (p_member_id, p_amount, p_trainer_fee, p_method, p_paid_on, p_covers_from, p_covers_to, p_note, p_idempotency)
  RETURNING id INTO v_payment_id;

  INSERT INTO audit_log (actor, action, entity, entity_id, meta)
  VALUES (v_actor, 'record_payment', 'payments', v_payment_id, jsonb_build_object('amount', p_amount));

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
