-- Fix create_member_with_payment to include current_due_date for the members table

CREATE OR REPLACE FUNCTION create_member_with_payment(
  p_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_join_date DATE,
  p_anchor_day INTEGER,
  p_plan_id UUID,
  p_has_trainer BOOLEAN,
  p_trainer_name TEXT,
  
  p_pay_amount INTEGER,
  p_pay_method TEXT,
  p_pay_covers_from DATE,
  p_pay_covers_to DATE,
  p_idempotency UUID,
  
  p_actor_id UUID
) RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Insert member WITH current_due_date
  INSERT INTO members (id, name, phone, email, join_date, anchor_day, plan_id, has_trainer, trainer_name, current_due_date)
  VALUES (COALESCE(p_id, gen_random_uuid()), p_name, p_phone, p_email, p_join_date, p_anchor_day, p_plan_id, p_has_trainer, p_trainer_name, p_pay_covers_to)
  RETURNING id INTO v_member_id;
  
  -- Insert payment if amount > 0
  IF p_pay_amount > 0 THEN
    INSERT INTO payments (member_id, amount, method, paid_on, covers_from, covers_to, idempotency_key)
    VALUES (v_member_id, p_pay_amount, p_pay_method, p_join_date, p_pay_covers_from, p_pay_covers_to, p_idempotency);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_log (actor, action, entity, entity_id, meta)
  VALUES (p_actor_id, 'create_member', 'members', v_member_id, jsonb_build_object('name', p_name, 'transactional', true));
  
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
